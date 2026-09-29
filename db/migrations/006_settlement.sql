-- 006_settlement.sql — land settlement / resurvey scheme areas (CONTRACTS §4, §10). Idempotent.
-- One polygon per scheme phase per state (e.g. AP Saswata Bhu Hakku resurvey blocks, TN Natham/UDR,
-- TG Dharani record purification). Parcels additionally carry status_flags.resurvey
-- ('completed' | 'in_progress' | 'pending'), written by the seed from these areas.

CREATE TABLE IF NOT EXISTS gis.settlement_schemes (
    id           serial PRIMARY KEY,
    state        text NOT NULL,                        -- AP | TN | TG
    scheme       text NOT NULL,                        -- programme name shown in the UI
    phase        text NOT NULL DEFAULT 'in_progress'
                 CHECK (phase IN ('notified', 'in_progress', 'completed')),
    survey_year  int,
    geom         geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS settlement_schemes_geom_gist ON gis.settlement_schemes USING gist (geom);
