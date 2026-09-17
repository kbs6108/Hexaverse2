-- 011_citizen_intents.sql — citizen intent types: record_correction + land_complaint (CONTRACTS §4, §8). Idempotent.
-- The citizen "Apply" wizard files these; both route to the officer queue like every other application.

ALTER TABLE landstack.applications DROP CONSTRAINT IF EXISTS applications_type_check;
ALTER TABLE landstack.applications ADD CONSTRAINT applications_type_check
    CHECK (type IN ('mutation', 'building_permission', 'ownership_verification', 'field_review',
                    'boundary_correction', 'record_correction', 'land_complaint'));

INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
SELECT v.type, v.from_status, v.to_status, v.allowed_role, v.allowed_department, v.action_label, v.is_terminal
FROM (VALUES
    ('record_correction', 'submitted',      'document_check', 'officer', 'revenue', 'Start document check', false),
    ('record_correction', 'document_check', 'approved',       'officer', 'revenue', 'Approve correction',   true),
    ('record_correction', 'document_check', 'returned',       'officer', 'revenue', 'Return to applicant',  false),
    ('record_correction', 'document_check', 'rejected',       'officer', 'revenue', 'Reject',               true),
    ('record_correction', 'returned',       'submitted',      'citizen', NULL,      'Resubmit',             false),
    ('land_complaint',    'submitted',      'in_review',      'officer', NULL,      'Take up for review',   false),
    ('land_complaint',    'in_review',      'resolved',       'officer', NULL,      'Mark resolved',        true),
    ('land_complaint',    'in_review',      'dismissed',      'officer', NULL,      'Dismiss',              true)
) AS v(type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
WHERE NOT EXISTS (
    SELECT 1 FROM landstack.transitions t
    WHERE t.type = v.type AND t.from_status = v.from_status AND t.to_status = v.to_status
);
