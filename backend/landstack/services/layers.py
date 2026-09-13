"""Layer catalog shared by the OGC collections and MVT tile routers, plus tile-envelope math.

Column lists are discovered from `information_schema.columns` (works for tables and views) and cached,
so the API never hard-codes the DATA lane's view columns. Geometry columns are excluded from
properties; arrays/json/timestamps are cast to text for MVT encoding.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from landstack.db import DBLike
from landstack.services.cache import TTLCache

TILE_EXTENT = 4096
EARTH_HALF_CIRCUMFERENCE = 20037508.342789244


@dataclass(frozen=True)
class Layer:
    name: str
    relation: str  # primary relation (may be a view written by the data lane)
    fallback: str | None = None  # used when the primary relation does not exist yet
    geom_col: str = "geom"
    id_col: str | None = None
    title: str = ""
    collections: bool = True
    tiles: bool = True
    min_zoom: int = 0


LAYERS: dict[str, Layer] = {
    "parcels": Layer(
        "parcels", "landstack.parcel_tile_features", "landstack.parcels", id_col="ulpin", title="Land parcels"
    ),
    "zones": Layer("zones", "dept_planning.zones", title="Planning zones"),
    "restriction_zones": Layer("restriction_zones", "gis.restriction_zones", title="Restriction zones"),
    "roads": Layer("roads", "gis.roads", title="Roads"),
    "water_lines": Layer("water_lines", "gis.water_lines", title="Water lines", collections=False),
    "projects": Layer("projects", "gis.projects", title="Government projects"),
    "village_boundary": Layer("village_boundary", "gis.village_boundary", title="Village boundary", tiles=False),
    "buildings": Layer("buildings", "landstack.buildings", geom_col="footprint", title="Buildings", tiles=False),
    "units": Layer(
        "units", "landstack.unit_tile_features", "landstack.units", title="3D units", collections=False, min_zoom=14
    ),
}

_columns_cache: TTLCache[list[dict[str, Any]]] = TTLCache(ttl_s=300.0)
_exists_cache: TTLCache[bool] = TTLCache(ttl_s=300.0)

GEOM_TYPES = {"geometry", "geography"}


def split_relation(relation: str) -> tuple[str, str]:
    schema, _, table = relation.partition(".")
    return (schema, table) if table else ("public", schema)


async def relation_exists(db: DBLike, relation: str) -> bool:
    cached = _exists_cache.get(relation)
    if cached is not None:
        return cached
    schema, table = split_relation(relation)
    ok = bool(await db.fetchval("SELECT to_regclass(:rel) IS NOT NULL", rel=f"{schema}.{table}"))
    _exists_cache.set(relation, ok)
    return ok


async def resolve_relation(db: DBLike, layer: Layer) -> str:
    if layer.fallback and not await relation_exists(db, layer.relation):
        return layer.fallback
    return layer.relation


async def columns(db: DBLike, relation: str) -> list[dict[str, Any]]:
    cached = _columns_cache.get(relation)
    if cached is not None:
        return cached
    schema, table = split_relation(relation)
    rows = await db.fetch(
        "SELECT column_name, udt_name FROM information_schema.columns "
        "WHERE table_schema = :s AND table_name = :t ORDER BY ordinal_position",
        s=schema,
        t=table,
    )
    _columns_cache.set(relation, rows)
    return rows


def property_exprs(cols: list[dict[str, Any]], geom_col: str, alias: str = "t", for_mvt: bool = False) -> list[str]:
    """SQL select expressions for non-geometry columns (arrays/json/timestamps cast to text)."""
    out = []
    for c in cols:
        name, udt = c["column_name"], str(c.get("udt_name") or "")
        if name == geom_col or udt in GEOM_TYPES:
            continue
        q = f'{alias}."{name}"'
        if udt.startswith("_"):
            out.append(f"array_to_string({q}, ',') AS \"{name}\"")
        elif udt in ("json", "jsonb"):
            out.append(f'{q}::text AS "{name}"' if for_mvt else q)
        elif udt in ("timestamp", "timestamptz", "date", "time", "interval"):
            out.append(f'{q}::text AS "{name}"')
        else:
            out.append(q)
    return out


# ------------------------------------------------------------------------------- tile math
def tile_envelope_3857(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """Web-Mercator bounds of an XYZ tile (same result as PostGIS ST_TileEnvelope)."""
    n = 2**z
    size = 2 * EARTH_HALF_CIRCUMFERENCE / n
    minx = -EARTH_HALF_CIRCUMFERENCE + x * size
    maxx = minx + size
    maxy = EARTH_HALF_CIRCUMFERENCE - y * size
    miny = maxy - size
    return (minx, miny, maxx, maxy)


def tile_envelope_4326(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    """Lon/lat bounds of an XYZ tile."""
    n = 2**z

    def lon(i: float) -> float:
        return i / n * 360.0 - 180.0

    def lat(j: float) -> float:
        return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * j / n))))

    return (lon(x), lat(y + 1), lon(x + 1), lat(y))


def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int, int]:
    n = 2**z
    xt = int((lon + 180.0) / 360.0 * n)
    lat_r = math.radians(lat)
    yt = int((1.0 - math.log(math.tan(lat_r) + 1 / math.cos(lat_r)) / math.pi) / 2.0 * n)
    return (min(max(xt, 0), n - 1), min(max(yt, 0), n - 1))


def valid_tile(z: int, x: int, y: int) -> bool:
    return 0 <= z <= 22 and 0 <= x < 2**z and 0 <= y < 2**z


def simplify_tolerance_deg(z: int, extent: int = TILE_EXTENT) -> float:
    """Degrees per ~1.5 MVT pixel at zoom z; applied only when z < 14."""
    return (360.0 / (2**z * extent)) * 1.5
