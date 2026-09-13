-- 005_views.sql — cross-schema status views used by tiles, stats and map colouring (CONTRACTS §4),
-- plus an application role that is created only when the connected user may do so (safe on Neon).

-- ---------------------------------------------------------------------------
-- landstack.parcel_status — one row per parcel, all flags derived from department tables.
--   pending_mutation : an application of type 'mutation' whose status is not a terminal
--                      to_status in landstack.transitions.
--   registered       : at least one deed exists for the parcel.
--   permission_status: status of the most recently applied building permission, else 'none'.
--   change_alert     : an OPEN alert of kind 'change_detected' exists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW landstack.parcel_status AS
SELECT
    p.ulpin,
    EXISTS (
        SELECT 1 FROM dept_legal.disputes d
        WHERE d.ulpin = p.ulpin AND d.status <> 'disposed'
    ) AS has_dispute,
    EXISTS (
        SELECT 1 FROM dept_registration.encumbrances e
        WHERE e.ulpin = p.ulpin AND e.kind = 'mortgage' AND e.active
    ) AS has_mortgage,
    COALESCE((
        SELECT sum(t.arrears) FROM dept_fiscal.property_tax t WHERE t.ulpin = p.ulpin
    ), 0)::numeric(12, 2) AS tax_arrears,
    EXISTS (
        SELECT 1 FROM landstack.applications a
        WHERE a.ulpin = p.ulpin
          AND a.type = 'mutation'
          AND a.status NOT IN (
              SELECT tr.to_status FROM landstack.transitions tr
              WHERE tr.type = 'mutation' AND tr.is_terminal
          )
    ) AS pending_mutation,
    EXISTS (
        SELECT 1 FROM dept_registration.deeds dd WHERE dd.ulpin = p.ulpin
    ) AS registered,
    COALESCE((
        SELECT bp.status FROM dept_planning.building_permissions bp
        WHERE bp.ulpin = p.ulpin
        ORDER BY bp.applied_on DESC, bp.permit_no DESC
        LIMIT 1
    ), 'none') AS permission_status,
    EXISTS (
        SELECT 1 FROM landstack.alerts al
        WHERE al.ulpin = p.ulpin AND al.kind = 'change_detected' AND al.status = 'open'
    ) AS change_alert
FROM landstack.parcels p;

-- ---------------------------------------------------------------------------
-- landstack.parcel_tile_features — parcels ⋈ parcel_status ⋈ ror (owner). Feature id = ulpin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW landstack.parcel_tile_features AS
SELECT
    p.ulpin,
    p.survey_no,
    p.village,
    p.land_use,
    p.zone_code,
    p.area_sqm,
    r.owner_name,
    r.ownership_type,
    s.registered,
    s.has_dispute,
    s.has_mortgage,
    s.tax_arrears,
    s.pending_mutation,
    s.permission_status,
    s.change_alert,
    p.geom
FROM landstack.parcels p
JOIN landstack.parcel_status s ON s.ulpin = p.ulpin
LEFT JOIN LATERAL (
    SELECT ror.owner_name, ror.ownership_type
    FROM dept_revenue.ror
    WHERE ror.ulpin = p.ulpin
    ORDER BY ror.updated_at DESC, ror.khata_no
    LIMIT 1
) r ON true;

-- ---------------------------------------------------------------------------
-- landstack.unit_tile_features — units ⋈ buildings for the 3D extrusion layer.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW landstack.unit_tile_features AS
SELECT
    u.ulpin_3d,
    b.ulpin,
    u.building_id,
    u.floor,
    u.unit_no,
    u.base_m,
    u.height_m,
    u.owner_name,
    u.geom
FROM landstack.units u
JOIN landstack.buildings b ON b.id = u.building_id;

-- ---------------------------------------------------------------------------
-- Application role. Skipped with a NOTICE when the current user lacks CREATEROLE
-- (Neon, Cloud SQL shared users). audit_log is INSERT-only for the app role.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'landstack_app') THEN
        CREATE ROLE landstack_app NOLOGIN;
    END IF;
    GRANT USAGE ON SCHEMA landstack, dept_revenue, dept_registration, dept_planning,
                          dept_fiscal, dept_legal, dept_utilities, gis TO landstack_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA
        landstack, dept_revenue, dept_registration, dept_planning,
        dept_fiscal, dept_legal, dept_utilities, gis TO landstack_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA
        landstack, dept_revenue, dept_registration, dept_planning,
        dept_fiscal, dept_legal, dept_utilities, gis TO landstack_app;
    REVOKE UPDATE, DELETE, TRUNCATE ON landstack.audit_log FROM landstack_app;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'landstack_app role setup skipped: %', SQLERRM;
END
$$;
