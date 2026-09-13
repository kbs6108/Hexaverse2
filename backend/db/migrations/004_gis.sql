-- 004_gis.sql — reference GIS layers and satellite change table (CONTRACTS §4). Idempotent.

CREATE SCHEMA IF NOT EXISTS gis;

CREATE TABLE IF NOT EXISTS gis.roads (
    id          serial PRIMARY KEY,
    name        text,
    road_class  text NOT NULL CHECK (road_class IN ('national', 'state', 'district', 'village', 'lane')),
    width_m     numeric(5, 1) NOT NULL,
    source      text NOT NULL DEFAULT 'synthetic',   -- synthetic | osm
    geom        geometry(LineString, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS roads_geom_gist ON gis.roads USING gist (geom);

CREATE TABLE IF NOT EXISTS gis.water_lines (
    id    serial PRIMARY KEY,
    name  text,
    kind  text NOT NULL DEFAULT 'supply_main',        -- supply_main | canal | drain
    geom  geometry(LineString, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS water_lines_geom_gist ON gis.water_lines USING gist (geom);

CREATE TABLE IF NOT EXISTS gis.restriction_zones (
    id    serial PRIMARY KEY,
    kind  text NOT NULL,                              -- flood | heritage | eco_sensitive | ...
    name  text NOT NULL,
    geom  geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS restriction_zones_geom_gist ON gis.restriction_zones USING gist (geom);

CREATE TABLE IF NOT EXISTS gis.projects (
    id      serial PRIMARY KEY,
    name    text NOT NULL,
    kind    text NOT NULL,                            -- road | metro | drainage | ...
    status  text NOT NULL DEFAULT 'proposed',         -- proposed | approved | under_construction
    geom    geometry(Geometry, 4326) NOT NULL         -- line or polygon
);
CREATE INDEX IF NOT EXISTS projects_geom_gist ON gis.projects USING gist (geom);

CREATE TABLE IF NOT EXISTS gis.village_boundary (
    id    serial PRIMARY KEY,
    name  text NOT NULL,
    geom  geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS village_boundary_geom_gist ON gis.village_boundary USING gist (geom);

-- Sentinel-2 index differencing per parcel (offline results; refreshed by tools/fetch_s2.py --compute).
CREATE TABLE IF NOT EXISTS gis.s2_change (
    ulpin       text PRIMARY KEY,
    date_a      date NOT NULL,
    date_b      date NOT NULL,
    ndvi_a      numeric(6, 4),
    ndvi_b      numeric(6, 4),
    ndbi_a      numeric(6, 4),
    ndbi_b      numeric(6, 4),
    d_ndvi      numeric(6, 4),
    d_ndbi      numeric(6, 4),
    label       text NOT NULL DEFAULT 'no_significant_change'
                CHECK (label IN ('vegetation_to_builtup', 'vegetation_loss', 'new_construction', 'no_significant_change')),
    confidence  numeric(4, 3),
    method      text NOT NULL DEFAULT 'index_difference',
    computed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS s2_change_label_idx ON gis.s2_change (label) WHERE label <> 'no_significant_change';
