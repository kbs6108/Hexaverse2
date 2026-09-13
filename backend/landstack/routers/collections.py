"""OGC API Features-shaped read access: `/landstack/collections`, `/{layer}/items`, `/parcels/items/{ulpin}`."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request

from landstack.db import DBLike, get_db
from landstack.errors import AppError, not_found
from landstack.services import layers as L

router = APIRouter(prefix="/landstack/collections", tags=["collections"])

STATUS_FILTERS = {
    "registered": 's."registered" IS TRUE',
    "unregistered": 's."registered" IS NOT TRUE',
    "has_dispute": 's."has_dispute" IS TRUE',
    "disputed": 's."has_dispute" IS TRUE',
    "has_mortgage": 's."has_mortgage" IS TRUE',
    "mortgaged": 's."has_mortgage" IS TRUE',
    "tax_arrears": 'COALESCE(s."tax_arrears", 0) > 0',
    "pending_mutation": 's."pending_mutation" IS TRUE',
    "change_alert": 's."change_alert" IS TRUE',
}


def parse_bbox(bbox: str | None) -> tuple[float, float, float, float] | None:
    if not bbox:
        return None
    try:
        parts = [float(p) for p in bbox.split(",")]
    except ValueError as exc:
        raise AppError(422, "invalid_bbox", "bbox must be 'minx,miny,maxx,maxy'") from exc
    if len(parts) != 4 or parts[0] >= parts[2] or parts[1] >= parts[3]:
        raise AppError(422, "invalid_bbox", "bbox must be 'minx,miny,maxx,maxy' with min < max")
    return parts[0], parts[1], parts[2], parts[3]


def _collection_doc(layer: L.Layer, base: str) -> dict[str, Any]:
    return {
        "id": layer.name,
        "title": layer.title or layer.name,
        "itemType": "feature",
        "crs": ["http://www.opengis.net/def/crs/OGC/1.3/CRS84"],
        "links": [
            {"href": f"{base}/landstack/collections/{layer.name}", "rel": "self", "type": "application/json"},
            {
                "href": f"{base}/landstack/collections/{layer.name}/items",
                "rel": "items",
                "type": "application/geo+json",
            },
            *(
                [
                    {
                        "href": f"{base}/landstack/tiles/{layer.name}/{{z}}/{{x}}/{{y}}.pbf",
                        "rel": "tiles",
                        "type": "application/vnd.mapbox-vector-tile",
                    }
                ]
                if layer.tiles
                else []
            ),
        ],
    }


def _base(request: Request) -> str:
    return str(request.base_url).rstrip("/")


@router.get("")
async def list_collections(request: Request) -> dict[str, Any]:
    base = _base(request)
    return {
        "links": [{"href": f"{base}/landstack/collections", "rel": "self", "type": "application/json"}],
        "collections": [_collection_doc(layer, base) for layer in L.LAYERS.values() if layer.collections],
    }


@router.get("/{layer}")
async def describe_collection(layer: str, request: Request) -> dict[str, Any]:
    return _collection_doc(_layer(layer), _base(request))


def _layer(name: str) -> L.Layer:
    layer = L.LAYERS.get(name)
    if layer is None or not layer.collections:
        raise not_found("collection", name)
    return layer


async def _query(
    db: DBLike, layer: L.Layer, where: list[str], params: dict[str, Any], limit: int, offset: int
) -> dict[str, Any]:
    relation = await L.resolve_relation(db, layer)
    cols = await L.columns(db, relation)
    if not cols:
        raise AppError(503, "layer_unavailable", f"relation {relation} not found (migrations applied?)")
    props = L.property_exprs(cols, layer.geom_col, "t")
    join = ""
    if layer.name == "parcels" and relation == "landstack.parcels":
        join = "LEFT JOIN landstack.parcel_status s ON s.ulpin = t.ulpin"
        props += [
            's."has_dispute"',
            's."has_mortgage"',
            's."tax_arrears"',
            's."pending_mutation"',
            's."registered"',
            's."permission_status"',
            's."change_alert"',
        ]
    elif layer.name == "parcels":
        join = ""  # the tile view already carries status columns
        where = [w.replace('s."', 't."') for w in where]
    sql_where = " AND ".join(where) if where else "TRUE"
    rows = await db.fetch(
        f'SELECT ST_AsGeoJSON(t."{layer.geom_col}", 7)::json AS __geometry, {", ".join(props)} '
        f"FROM {relation} t {join} WHERE {sql_where} LIMIT :limit OFFSET :offset",
        **params,
        limit=limit,
        offset=offset,
    )
    total = await db.fetchval(f"SELECT count(*) FROM {relation} t {join} WHERE {sql_where}", **params)
    features = []
    for r in rows:
        geometry = r.pop("__geometry", None)
        fid = r.get(layer.id_col) if layer.id_col else r.get("id")
        features.append({"type": "Feature", "id": fid, "geometry": geometry, "properties": r})
    return {
        "type": "FeatureCollection",
        "features": features,
        "numberMatched": int(total or 0),
        "numberReturned": len(features),
    }


@router.get("/{layer}/items")
async def items(
    layer: str,
    request: Request,
    db: DBLike = Depends(get_db),
    bbox: str | None = Query(None, description="minx,miny,maxx,maxy in EPSG:4326"),
    limit: int = Query(100, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    land_use: str | None = None,
    status: str | None = None,
    zone_code: str | None = None,
    survey_no: str | None = None,
    kind: str | None = None,
) -> dict[str, Any]:
    lyr = _layer(layer)
    where: list[str] = []
    params: dict[str, Any] = {}
    box = parse_bbox(bbox)
    if box:
        where.append(f't."{lyr.geom_col}" && ST_MakeEnvelope(:minx, :miny, :maxx, :maxy, 4326)')
        params.update(minx=box[0], miny=box[1], maxx=box[2], maxy=box[3])
    if lyr.name == "parcels":
        if land_use:
            where.append('t."land_use" = :land_use')
            params["land_use"] = land_use
        if zone_code:
            where.append('t."zone_code" = :zone_code')
            params["zone_code"] = zone_code
        if survey_no:
            where.append('t."survey_no" ILIKE :survey_no')
            params["survey_no"] = f"{survey_no}%"
        if status:
            if status.startswith("permission:"):
                where.append('s."permission_status" = :perm')
                params["perm"] = status.split(":", 1)[1]
            elif status in STATUS_FILTERS:
                where.append(STATUS_FILTERS[status])
            else:
                raise AppError(
                    422, "invalid_status", f"status must be one of {sorted(STATUS_FILTERS)} or permission:<value>"
                )
    elif kind:
        where.append('t."kind" = :kind')
        params["kind"] = kind
    doc = await _query(db, lyr, where, params, limit, offset)
    base = _base(request)
    doc["links"] = [{"href": str(request.url), "rel": "self", "type": "application/geo+json"}]
    if offset + limit < doc["numberMatched"]:
        doc["links"].append(
            {
                "href": f"{base}/landstack/collections/{layer}/items?limit={limit}&offset={offset + limit}"
                + (f"&bbox={bbox}" if bbox else ""),
                "rel": "next",
                "type": "application/geo+json",
            }
        )
    return doc


@router.get("/parcels/items/{ulpin}")
async def parcel_item(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    doc = await _query(db, L.LAYERS["parcels"], ['t."ulpin" = :ulpin'], {"ulpin": ulpin}, 1, 0)
    if not doc["features"]:
        raise not_found("parcel", ulpin)
    return doc["features"][0]
