"""Mapbox Vector Tiles: `GET /landstack/tiles/{layer}/{z}/{x}/{y}.pbf` via ST_TileEnvelope + ST_AsMVT."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from landstack.db import DBLike, get_db
from landstack.errors import AppError, not_found
from landstack.services import layers as L

router = APIRouter(prefix="/landstack/tiles", tags=["tiles"])
MVT_TYPE = "application/vnd.mapbox-vector-tile"


def tile_sql(layer: L.Layer, relation: str, props: list[str], z: int) -> str:
    """Build the MVT query for a layer (simplified geometry below zoom 14)."""
    geom = f't."{layer.geom_col}"'
    if z < 14:
        geom = f"ST_SimplifyPreserveTopology({geom}, :tol)"
    select_props = (", " + ", ".join(props)) if props else ""
    return f"""
        WITH b AS (SELECT ST_TileEnvelope(:z, :x, :y) AS geom),
        f AS (
            SELECT ST_AsMVTGeom(ST_Transform({geom}, 3857), b.geom, {L.TILE_EXTENT}, 64, true) AS geom{select_props}
            FROM {relation} t, b
            WHERE t."{layer.geom_col}" && ST_Transform(ST_Expand(b.geom, (ST_XMax(b.geom) - ST_XMin(b.geom)) / 64), 4326)
        )
        SELECT ST_AsMVT(f.*, :name, {L.TILE_EXTENT}, 'geom') FROM f WHERE f.geom IS NOT NULL
    """


@router.get("/{layer}/{z}/{x}/{y}.pbf", response_class=Response)
async def tile(layer: str, z: int, x: int, y: int, db: DBLike = Depends(get_db)) -> Response:
    lyr = L.LAYERS.get(layer)
    if lyr is None or not lyr.tiles:
        raise not_found("tile layer", layer)
    if not L.valid_tile(z, x, y):
        raise AppError(422, "invalid_tile", "tile coordinates out of range")
    headers = {"Cache-Control": "public, max-age=60", "X-Layer": layer}
    if z < lyr.min_zoom:
        return Response(status_code=204, headers=headers)
    relation = await L.resolve_relation(db, lyr)
    cols = await L.columns(db, relation)
    if not cols:
        raise AppError(503, "layer_unavailable", f"relation {relation} not found (migrations applied?)")
    props = L.property_exprs(cols, lyr.geom_col, "t", for_mvt=True)
    params: dict[str, object] = {"z": z, "x": x, "y": y, "name": layer}
    if z < 14:
        params["tol"] = L.simplify_tolerance_deg(z)
    data = await db.fetchval(tile_sql(lyr, relation, props, z), **params)
    if not data:
        return Response(status_code=204, headers=headers)
    return Response(content=bytes(data), media_type=MVT_TYPE, headers=headers)
