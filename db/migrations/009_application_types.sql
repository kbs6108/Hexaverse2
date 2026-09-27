-- 009_application_types.sql — allow the boundary_correction application type (CONTRACTS §4, §8). Idempotent.

ALTER TABLE tract.applications DROP CONSTRAINT IF EXISTS applications_type_check;
ALTER TABLE tract.applications ADD CONSTRAINT applications_type_check
    CHECK (type IN ('mutation', 'building_permission', 'ownership_verification', 'field_review', 'boundary_correction'));
