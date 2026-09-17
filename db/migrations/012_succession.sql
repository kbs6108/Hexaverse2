-- 012_succession.sql — nominee data on the RoR + the `succession` workflow (CONTRACTS §4, §7, §8). Idempotent.
-- A deceased owner's nominees are recorded by the revenue department; a citizen proposes the
-- reallocation, an officer approves it (dispute-blocked in triage; approval runs the mutation).

ALTER TABLE dept_revenue.ror ADD COLUMN IF NOT EXISTS nominees jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE landstack.applications DROP CONSTRAINT IF EXISTS applications_type_check;
ALTER TABLE landstack.applications ADD CONSTRAINT applications_type_check
    CHECK (type IN ('mutation', 'building_permission', 'ownership_verification', 'field_review',
                    'boundary_correction', 'record_correction', 'land_complaint', 'succession'));

INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
SELECT v.type, v.from_status, v.to_status, v.allowed_role, v.allowed_department, v.action_label, v.is_terminal
FROM (VALUES
    ('succession', 'submitted',      'document_check', 'officer', 'revenue', 'Start document check', false),
    ('succession', 'document_check', 'approved',       'officer', 'revenue', 'Approve succession',   true),
    ('succession', 'document_check', 'returned',       'officer', 'revenue', 'Return to applicant',  false),
    ('succession', 'document_check', 'rejected',       'officer', 'revenue', 'Reject',               true),
    ('succession', 'returned',       'submitted',      'citizen', NULL,      'Resubmit',             false)
) AS v(type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
WHERE NOT EXISTS (
    SELECT 1 FROM landstack.transitions t
    WHERE t.type = v.type AND t.from_status = v.from_status AND t.to_status = v.to_status
);

-- Demo nominee data on two AP story parcels (only where none was recorded yet).
UPDATE dept_revenue.ror
SET nominees = '[{"name": "Lakshmi Devi", "relation": "spouse", "share": 0.5},
                 {"name": "Arjun Kumar",  "relation": "son",    "share": 0.5}]'::jsonb
WHERE survey_no = '123/4' AND (state IS NULL OR state = 'AP') AND nominees = '[]'::jsonb;

UPDATE dept_revenue.ror
SET nominees = '[{"name": "Meena Kumari", "relation": "daughter", "share": 1.0}]'::jsonb
WHERE survey_no = '126' AND (state IS NULL OR state = 'AP') AND nominees = '[]'::jsonb;
