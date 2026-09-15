-- 010_3d_dimensions.sql — accurate 3D attributes (CONTRACTS §4, §5, §9). Idempotent.
-- Buildings carry measured footprint dimensions and basement count; the unit tile view
-- exposes per-unit floor area and the building name so the 3D layer is inspectable.

ALTER TABLE landstack.buildings ADD COLUMN IF NOT EXISTS width_m numeric(6, 1);
ALTER TABLE landstack.buildings ADD COLUMN IF NOT EXISTS depth_m numeric(6, 1);
ALTER TABLE landstack.buildings ADD COLUMN IF NOT EXISTS basement_floors int NOT NULL DEFAULT 0;

-- CREATE OR REPLACE cannot insert columns before geom; the view is read-only, drop is safe.
DROP VIEW IF EXISTS landstack.unit_tile_features;
CREATE VIEW landstack.unit_tile_features AS
SELECT
    u.ulpin_3d,
    b.ulpin,
    u.building_id,
    u.floor,
    u.unit_no,
    u.base_m,
    u.height_m,
    u.owner_name,
    b.name AS building_name,
    round(ST_Area(u.geom::geography)::numeric, 1)::float8 AS area_sqm,
    u.geom
FROM landstack.units u
JOIN landstack.buildings b ON b.id = u.building_id;
