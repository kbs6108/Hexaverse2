-- 008_boundary_workflow.sql — boundary_correction workflow transitions (CONTRACTS §8). Idempotent.
-- Bounded parcel-geometry editing: a revenue officer (or admin) proposes a corrected boundary,
-- validation (area cap · no overlap · village containment) gates the proposal, a second
-- geometry check gates approval, and approval applies the geometry + syncs the RoR extent.

INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
SELECT v.type, v.from_status, v.to_status, v.allowed_role, v.allowed_department, v.action_label, v.is_terminal
FROM (VALUES
    ('boundary_correction', 'submitted',      'geometry_check', 'officer', 'revenue', 'Start geometry check', false),
    ('boundary_correction', 'geometry_check', 'approved',       'officer', 'revenue', 'Approve & apply',      true),
    ('boundary_correction', 'geometry_check', 'returned',       'officer', 'revenue', 'Return to proposer',   true),
    ('boundary_correction', 'geometry_check', 'rejected',       'officer', 'revenue', 'Reject',               true)
) AS v(type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
WHERE NOT EXISTS (
    SELECT 1 FROM landstack.transitions t
    WHERE t.type = v.type AND t.from_status = v.from_status AND t.to_status = v.to_status
);
