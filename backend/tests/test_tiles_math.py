"""XYZ tile envelope maths (mirrors ST_TileEnvelope) and the MVT SQL shape."""

from __future__ import annotations

import pytest

from landstack.routers.tiles import tile_sql
from landstack.services import layers as L

HALF = L.EARTH_HALF_CIRCUMFERENCE


def test_world_tile() -> None:
    assert L.tile_envelope_3857(0, 0, 0) == (-HALF, -HALF, HALF, HALF)
    minx, miny, maxx, maxy = L.tile_envelope_4326(0, 0, 0)
    assert (
        (minx, maxx) == (-180.0, 180.0)
        and maxy == pytest.approx(85.0511, abs=1e-3)
        and miny == pytest.approx(-85.0511, abs=1e-3)
    )


def test_zoom_one_quadrants() -> None:
    assert L.tile_envelope_3857(1, 0, 0) == (-HALF, 0.0, 0.0, HALF)  # north-west
    assert L.tile_envelope_3857(1, 1, 1) == (0.0, -HALF, HALF, 0.0)  # south-east


def test_mangalagiri_roundtrip() -> None:
    lon, lat, z = 80.5560, 16.4420, 15
    x, y = L.lonlat_to_tile(lon, lat, z)
    minx, miny, maxx, maxy = L.tile_envelope_4326(z, x, y)
    assert minx <= lon < maxx and miny <= lat < maxy
    # consistent with the mercator envelope of the same tile
    mx = lon / 180.0 * HALF
    m = L.tile_envelope_3857(z, x, y)
    assert m[0] <= mx < m[2]


def test_validity_and_tolerance() -> None:
    assert L.valid_tile(0, 0, 0) and L.valid_tile(15, 23713, 15012)
    assert not L.valid_tile(3, 8, 0) and not L.valid_tile(-1, 0, 0) and not L.valid_tile(23, 0, 0)
    assert L.simplify_tolerance_deg(10) > L.simplify_tolerance_deg(13) > 0


def test_tile_sql_shape() -> None:
    layer = L.LAYERS["parcels"]
    low = tile_sql(layer, "landstack.parcel_tile_features", ['t."ulpin"', 't."land_use"'], z=12)
    high = tile_sql(layer, "landstack.parcel_tile_features", ['t."ulpin"'], z=15)
    assert "ST_SimplifyPreserveTopology" in low and ":tol" in low
    assert "ST_SimplifyPreserveTopology" not in high
    for sql in (low, high):
        assert (
            "ST_TileEnvelope(:z, :x, :y)" in sql
            and "ST_AsMVTGeom" in sql
            and "ST_AsMVT(f.*, :name, 4096, 'geom')" in sql
        )
    assert set(L.LAYERS) >= {"parcels", "zones", "restriction_zones", "roads", "water_lines", "projects", "units"}


def test_property_exprs_casts() -> None:
    cols = [
        {"column_name": "geom", "udt_name": "geometry"},
        {"column_name": "ulpin", "udt_name": "text"},
        {"column_name": "permissible_uses", "udt_name": "_text"},
        {"column_name": "status_flags", "udt_name": "jsonb"},
        {"column_name": "updated_at", "udt_name": "timestamptz"},
    ]
    exprs = L.property_exprs(cols, "geom", "t", for_mvt=True)
    assert exprs == [
        't."ulpin"',
        'array_to_string(t."permissible_uses", \',\') AS "permissible_uses"',
        't."status_flags"::text AS "status_flags"',
        't."updated_at"::text AS "updated_at"',
    ]
