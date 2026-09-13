-- 003_departments.sql — six department schemas (CONTRACTS §4, §7). Idempotent.
-- Each department sub-app reads ONLY its own schema. Vocabulary intentionally differs per department.
-- No foreign keys to landstack.parcels: departments are independent systems joined by ulpin.

-- ---------------------------------------------------------------------------
-- Revenue (Record of Rights)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS dept_revenue;

CREATE TABLE IF NOT EXISTS dept_revenue.ror (
    khata_no          text PRIMARY KEY,
    ulpin             text NOT NULL,
    survey_no         text NOT NULL,
    owner_name        text NOT NULL,
    father_name       text,
    ownership_type    text NOT NULL CHECK (ownership_type IN ('patta', 'joint', 'govt')),
    extent_sqm        numeric(12, 2) NOT NULL,
    classification    text NOT NULL CHECK (classification IN ('dry', 'wet', 'gramakantam', 'govt_poramboke')),
    mutation_history  jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ror_ulpin_idx ON dept_revenue.ror (ulpin);
CREATE INDEX IF NOT EXISTS ror_owner_name_trgm ON dept_revenue.ror USING gin (owner_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ror_survey_no_idx ON dept_revenue.ror (survey_no);

CREATE TABLE IF NOT EXISTS dept_revenue.mutations (
    id              serial PRIMARY KEY,
    ulpin           text NOT NULL,
    from_owner      text,
    to_owner        text NOT NULL,
    reason          text,
    application_id  text,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mutations_ulpin_idx ON dept_revenue.mutations (ulpin, created_at DESC);

-- ---------------------------------------------------------------------------
-- Registration (deeds, encumbrances, outbox)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS dept_registration;

-- deeds.extent_sqm is the extent as written in the deed; it is compared with ror.extent_sqm
-- by the consistency service (area mismatch story parcel 127/1).
CREATE TABLE IF NOT EXISTS dept_registration.deeds (
    doc_no         text PRIMARY KEY,
    ulpin          text NOT NULL,
    deed_type      text NOT NULL,          -- sale | gift | partition | settlement | release | mortgage
    executant      text NOT NULL,
    claimant       text NOT NULL,
    consideration  numeric(14, 2),
    extent_sqm     numeric(12, 2),
    registered_on  date NOT NULL,
    sro_code       text NOT NULL
);
CREATE INDEX IF NOT EXISTS deeds_ulpin_idx ON dept_registration.deeds (ulpin, registered_on DESC);
CREATE INDEX IF NOT EXISTS deeds_claimant_trgm ON dept_registration.deeds USING gin (claimant gin_trgm_ops);

CREATE TABLE IF NOT EXISTS dept_registration.encumbrances (
    id         serial PRIMARY KEY,
    ulpin      text NOT NULL,
    kind       text NOT NULL,              -- mortgage | lien | lease | attachment
    holder     text NOT NULL,
    amount     numeric(14, 2),
    from_date  date NOT NULL,
    to_date    date,
    active     boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS encumbrances_ulpin_idx ON dept_registration.encumbrances (ulpin, active);

CREATE TABLE IF NOT EXISTS dept_registration.outbox (
    id            serial PRIMARY KEY,
    event         text NOT NULL,
    ulpin         text NOT NULL,
    payload       jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now(),
    delivered_at  timestamptz
);
CREATE INDEX IF NOT EXISTS outbox_undelivered_idx ON dept_registration.outbox (created_at) WHERE delivered_at IS NULL;

-- ---------------------------------------------------------------------------
-- Planning (master-plan zones, building permissions)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS dept_planning;

CREATE TABLE IF NOT EXISTS dept_planning.zones (
    id                serial PRIMARY KEY,
    zone_code         text NOT NULL,       -- R1 | R2 | C1 | AG | IND | PUB
    name              text NOT NULL,
    permissible_uses  text[] NOT NULL DEFAULT '{}',
    geom              geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS zones_geom_gist ON dept_planning.zones USING gist (geom);
CREATE INDEX IF NOT EXISTS zones_code_idx ON dept_planning.zones (zone_code);

CREATE TABLE IF NOT EXISTS dept_planning.building_permissions (
    permit_no       text PRIMARY KEY,
    ulpin           text NOT NULL,
    status          text NOT NULL CHECK (status IN ('approved', 'pending', 'rejected')),
    floors          integer,
    built_up_sqm    numeric(12, 2),
    applied_on      date NOT NULL,
    approved_on     date,
    conditions      text,
    application_id  text
);
CREATE INDEX IF NOT EXISTS building_permissions_ulpin_idx ON dept_planning.building_permissions (ulpin, applied_on DESC);

-- ---------------------------------------------------------------------------
-- Fiscal (property tax, guideline valuation)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS dept_fiscal;

CREATE TABLE IF NOT EXISTS dept_fiscal.property_tax (
    assessment_no  text PRIMARY KEY,
    ulpin          text NOT NULL,
    annual_demand  numeric(12, 2) NOT NULL,
    paid_till      text,                   -- financial year label, e.g. '2025-26'
    arrears        numeric(12, 2) NOT NULL DEFAULT 0,
    last_paid_on   date
);
CREATE INDEX IF NOT EXISTS property_tax_ulpin_idx ON dept_fiscal.property_tax (ulpin);

CREATE TABLE IF NOT EXISTS dept_fiscal.valuation (
    ulpin                    text PRIMARY KEY,
    guideline_value_per_sqm  numeric(12, 2) NOT NULL,
    effective_from           date NOT NULL
);

-- ---------------------------------------------------------------------------
-- Legal (civil disputes)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS dept_legal;

CREATE TABLE IF NOT EXISTS dept_legal.disputes (
    case_no       text PRIMARY KEY,
    ulpin         text NOT NULL,
    court         text NOT NULL,
    nature        text NOT NULL,           -- title | partition | boundary | injunction
    filed_on      date NOT NULL,
    status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'stayed', 'disposed')),
    next_hearing  date
);
CREATE INDEX IF NOT EXISTS disputes_ulpin_idx ON dept_legal.disputes (ulpin, status);

-- ---------------------------------------------------------------------------
-- Utilities (service connections)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS dept_utilities;

CREATE TABLE IF NOT EXISTS dept_utilities.connections (
    ulpin               text PRIMARY KEY,
    water               boolean NOT NULL DEFAULT false,
    electricity         boolean NOT NULL DEFAULT false,
    sewer               boolean NOT NULL DEFAULT false,
    road_access_m       numeric(8, 2),
    nearest_road_class  text                -- national | state | district | village | lane
);
