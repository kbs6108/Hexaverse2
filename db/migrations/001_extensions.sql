-- 001_extensions.sql — PostGIS + trigram search. Idempotent.
-- postgis_sfcgal (3D ops) is optional: managed Postgres (Neon, Cloud SQL) may not ship it,
-- so failure to create it is downgraded to a NOTICE.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis_sfcgal;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'postgis_sfcgal not available, skipping (%).', SQLERRM;
END
$$;
