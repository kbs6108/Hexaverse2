-- 002_landstack.sql — gateway schema (CONTRACTS §4, §8). Idempotent.
-- Conventions: all geometry EPSG:4326; area via ST_Area(geom::geography).

CREATE SCHEMA IF NOT EXISTS landstack;

-- Applied-migration ledger (also bootstrapped by tools/migrate.py before 001 runs).
CREATE TABLE IF NOT EXISTS landstack.schema_migrations (
    filename    text PRIMARY KEY,
    checksum    text,
    applied_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Cadastre
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landstack.parcels (
    ulpin         text PRIMARY KEY,
    state         text NOT NULL DEFAULT 'AP',
    district      text NOT NULL DEFAULT 'Guntur',
    taluk         text NOT NULL DEFAULT 'Mangalagiri',
    village       text NOT NULL DEFAULT 'Mangalagiri (R)',
    survey_no     text NOT NULL,
    sub_division  text,
    geom          geometry(MultiPolygon, 4326) NOT NULL,
    area_sqm      numeric(12, 2) NOT NULL,
    land_use      text NOT NULL,
    zone_code     text,
    status_flags  jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS parcels_geom_gist ON landstack.parcels USING gist (geom);
CREATE INDEX IF NOT EXISTS parcels_survey_no_trgm ON landstack.parcels USING gin (survey_no gin_trgm_ops);
CREATE INDEX IF NOT EXISTS parcels_village_survey_idx ON landstack.parcels (village, survey_no);
CREATE INDEX IF NOT EXISTS parcels_land_use_idx ON landstack.parcels (land_use);

CREATE TABLE IF NOT EXISTS landstack.buildings (
    id         serial PRIMARY KEY,
    ulpin      text NOT NULL REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    footprint  geometry(MultiPolygon, 4326) NOT NULL,
    floors     integer NOT NULL CHECK (floors > 0),
    height_m   numeric(6, 2) NOT NULL,
    name       text
);
CREATE INDEX IF NOT EXISTS buildings_footprint_gist ON landstack.buildings USING gist (footprint);
CREATE INDEX IF NOT EXISTS buildings_ulpin_idx ON landstack.buildings (ulpin);

-- units.ulpin is denormalised from buildings.ulpin so tiles/search never need the join.
CREATE TABLE IF NOT EXISTS landstack.units (
    id           serial PRIMARY KEY,
    building_id  integer NOT NULL REFERENCES landstack.buildings (id) ON DELETE CASCADE,
    ulpin        text NOT NULL REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    ulpin_3d     text NOT NULL UNIQUE,              -- '<ULPIN>-F<floor:02>-U<unit:02>'
    floor        integer NOT NULL,
    unit_no      text NOT NULL,
    geom         geometry(Polygon, 4326) NOT NULL,
    base_m       numeric(6, 2) NOT NULL,
    height_m     numeric(6, 2) NOT NULL,
    owner_name   text
);
CREATE INDEX IF NOT EXISTS units_geom_gist ON landstack.units USING gist (geom);
CREATE INDEX IF NOT EXISTS units_building_idx ON landstack.units (building_id);

-- ---------------------------------------------------------------------------
-- Identity, consent
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landstack.users (
    uid         text PRIMARY KEY,
    email       text,
    name        text NOT NULL,
    role        text NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')),
    department  text CHECK (department IS NULL OR department IN ('revenue', 'registration', 'planning')),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landstack.consents (
    id              serial PRIMARY KEY,
    ulpin           text NOT NULL REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    granted_to_uid  text NOT NULL,
    granted_by      text,
    expires_at      timestamptz NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consents_lookup_idx ON landstack.consents (granted_to_uid, ulpin, expires_at);

-- ---------------------------------------------------------------------------
-- Workflow
-- ---------------------------------------------------------------------------
-- Backend may mint ids as 'APP-2026-' || lpad(nextval('landstack.application_id_seq')::text, 6, '0').
CREATE SEQUENCE IF NOT EXISTS landstack.application_id_seq;

CREATE TABLE IF NOT EXISTS landstack.applications (
    id                   text PRIMARY KEY,                    -- 'APP-2026-000123'
    ulpin                text NOT NULL REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    type                 text NOT NULL CHECK (type IN ('mutation', 'building_permission', 'ownership_verification', 'field_review')),
    applicant_uid        text,
    applicant_name       text,
    status               text NOT NULL,
    payload              jsonb NOT NULL DEFAULT '{}'::jsonb,
    assigned_department  text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS applications_ulpin_idx ON landstack.applications (ulpin);
CREATE INDEX IF NOT EXISTS applications_queue_idx ON landstack.applications (assigned_department, status, created_at);
CREATE INDEX IF NOT EXISTS applications_applicant_idx ON landstack.applications (applicant_uid, created_at);

CREATE TABLE IF NOT EXISTS landstack.transitions (
    id                  serial PRIMARY KEY,
    type                text NOT NULL,
    from_status         text NOT NULL,
    to_status           text NOT NULL,
    allowed_role        text NOT NULL,          -- citizen | officer | admin
    allowed_department  text,                   -- NULL = any department
    action_label        text NOT NULL,
    is_terminal         boolean NOT NULL DEFAULT false   -- to_status ends the workflow
);
CREATE UNIQUE INDEX IF NOT EXISTS transitions_unique_idx
    ON landstack.transitions (type, from_status, to_status, allowed_role, COALESCE(allowed_department, '*'));

INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal) VALUES
    -- mutation (revenue officer); citizen resubmits a returned application
    ('mutation', 'submitted',          'document_check',     'officer', 'revenue',  'Start document check',        false),
    ('mutation', 'document_check',     'field_verification', 'officer', 'revenue',  'Send for field verification', false),
    ('mutation', 'field_verification', 'approved',           'officer', 'revenue',  'Approve mutation',            true),
    ('mutation', 'field_verification', 'returned',           'officer', 'revenue',  'Return to applicant',         false),
    ('mutation', 'field_verification', 'rejected',           'officer', 'revenue',  'Reject mutation',             true),
    ('mutation', 'returned',           'submitted',          'citizen', NULL,       'Resubmit application',        false),
    -- building permission (planning officer)
    ('building_permission', 'submitted',       'planning_check',  'officer', 'planning', 'Run planning check',        false),
    ('building_permission', 'planning_check',  'site_inspection', 'officer', 'planning', 'Schedule site inspection',  false),
    ('building_permission', 'site_inspection', 'approved',        'officer', 'planning', 'Approve permission',        true),
    ('building_permission', 'site_inspection', 'rejected',        'officer', 'planning', 'Reject permission',         true),
    -- field review (admin assigns, revenue/planning officer resolves)
    ('field_review', 'open',     'assigned', 'admin',   NULL,       'Assign field review', false),
    ('field_review', 'assigned', 'resolved', 'officer', 'revenue',  'Mark resolved',       true),
    ('field_review', 'assigned', 'resolved', 'officer', 'planning', 'Mark resolved',       true)
ON CONFLICT (type, from_status, to_status, allowed_role, COALESCE(allowed_department, '*')) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Audit, alerts, reports, connectors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landstack.audit_log (
    id           bigserial PRIMARY KEY,
    ts           timestamptz NOT NULL DEFAULT now(),
    actor_uid    text,
    actor_name   text,
    actor_role   text,
    action       text NOT NULL,
    entity_type  text NOT NULL,
    entity_id    text,
    ulpin        text,
    before       jsonb,
    after        jsonb,
    source       text NOT NULL DEFAULT 'gateway'
);
CREATE INDEX IF NOT EXISTS audit_log_ulpin_ts_idx ON landstack.audit_log (ulpin, ts DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON landstack.audit_log (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS landstack.alerts (
    id               serial PRIMARY KEY,
    ulpin            text NOT NULL REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    kind             text NOT NULL CHECK (kind IN ('change_detected', 'inconsistency', 'pending_mutation')),
    severity         text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    title            text NOT NULL,
    detail           jsonb NOT NULL DEFAULT '{}'::jsonb,
    status           text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved')),
    assigned_to_uid  text,
    resolved_at      timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alerts_ulpin_idx ON landstack.alerts (ulpin);
CREATE INDEX IF NOT EXISTS alerts_status_idx ON landstack.alerts (status, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS landstack.reports (
    id              text PRIMARY KEY,
    ulpin           text NOT NULL REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    issued_to_uid   text,
    issued_to_name  text,
    issued_at       timestamptz NOT NULL DEFAULT now(),
    sha256          text NOT NULL,
    signature       text NOT NULL,
    storage_key     text NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_ulpin_idx ON landstack.reports (ulpin);

CREATE TABLE IF NOT EXISTS landstack.connector_status (
    name        text PRIMARY KEY,
    ok          boolean NOT NULL DEFAULT true,
    latency_ms  integer,
    last_sync   timestamptz,
    note        text
);

INSERT INTO landstack.connector_status (name, ok, latency_ms, last_sync, note) VALUES
    ('revenue',      true, 41, now(), 'AP Meebhoomi (mock) — RoR / khata'),
    ('registration', true, 55, now(), 'IGRS AP (mock) — deeds, encumbrances'),
    ('planning',     true, 38, now(), 'APCRDA / DTCP (mock) — zoning, permissions'),
    ('fiscal',       true, 47, now(), 'CDMA property tax (mock) — demand, valuation'),
    ('legal',        true, 62, now(), 'eCourts (mock) — civil disputes'),
    ('utilities',    true, 35, now(), 'APSPDCL / PHED (mock) — connections'),
    ('satellite',    true, 120, now(), 'Sentinel-2 L2A via Planetary Computer (offline COGs when S2_OFFLINE=1)')
ON CONFLICT (name) DO NOTHING;
