-- 013_hierarchy_transitions.sql — Multi-tier administrative hierarchy & designation-gated workflow transitions.
-- Introduces VRO, Surveyor, RI, and Tahsildar statutory separation of powers.

ALTER TABLE landstack.transitions ADD COLUMN IF NOT EXISTS allowed_designation text;
ALTER TABLE landstack.users ADD COLUMN IF NOT EXISTS designation text;

-- Drop old unique index that did not account for designations
DROP INDEX IF EXISTS landstack.transitions_unique_idx;

-- Recreate unique index including allowed_designation
CREATE UNIQUE INDEX IF NOT EXISTS transitions_unique_idx
    ON landstack.transitions (type, from_status, to_status, allowed_role, COALESCE(allowed_department, '*'), COALESCE(allowed_designation, '*'));

-- Remove legacy un-gated transitions so they don't allow officers to bypass the statutory chain
DELETE FROM landstack.transitions;

-- Insert complete statutory hierarchy transitions
INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, allowed_designation, action_label, is_terminal) VALUES
    -- 1. MUTATION (Revenue Department: VRO -> Surveyor -> RI -> Tahsildar)
    ('mutation', 'returned',              'submitted',             'citizen', NULL,       NULL,            'Resubmit Application',                           false),
    ('mutation', 'submitted',             'field_inspection',      'officer', 'revenue',  'vro',           'Conduct VRO Field Inspection & Panchanama',       false),
    ('mutation', 'submitted',             'document_check',        'officer', 'revenue',  'vro',           'VRO Preliminary Document Scrutiny',              false),
    ('mutation', 'document_check',        'field_inspection',      'officer', 'revenue',  'vro',           'Submit VRO Panchanama & Forward to Surveyor',     false),
    ('mutation', 'document_check',        'boundary_demarcation',  'officer', 'revenue',  'vro',           'Submit VRO Panchanama & Request Demarcation',     false),
    ('mutation', 'document_check',        'field_verification',    'officer', 'revenue',  'vro',           'Forward for Cadastral Survey',                   false),
    ('mutation', 'field_inspection',      'boundary_demarcation',  'officer', 'revenue',  'vro',           'Submit VRO Ground Panchanama to Surveyor',        false),
    ('mutation', 'field_verification',    'boundary_demarcation',  'officer', 'revenue',  'vro',           'Submit VRO Ground Panchanama to Surveyor',        false),
    ('mutation', 'boundary_demarcation',  'scrutiny_review',       'officer', 'revenue',  'surveyor',      'Submit Cadastral Demarcation & FMB Report',       false),
    ('mutation', 'field_verification',    'scrutiny_review',       'officer', 'revenue',  'surveyor',      'Submit Cadastral Demarcation & FMB Report',       false),
    ('mutation', 'scrutiny_review',       'statutory_sanction',    'officer', 'revenue',  'ri',            'RI Supervisory Endorsement to Tahsildar',         false),
    ('mutation', 'statutory_sanction',    'approved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Approval Order & Issue RoR',        true),
    ('mutation', 'statutory_sanction',    'rejected',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Rejection Order (Speaking Order)',  true),
    ('mutation', 'statutory_sanction',    'returned',              'officer', 'revenue',  'tahsildar',     'Return to Applicant for Clarification',          false),
    ('mutation', 'scrutiny_review',       'approved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Approval Order & Issue RoR',        true),
    ('mutation', 'scrutiny_review',       'rejected',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Rejection Order (Speaking Order)',  true),
    ('mutation', 'scrutiny_review',       'returned',              'officer', 'revenue',  'tahsildar',     'Return to Applicant for Clarification',          false),
    ('mutation', 'field_verification',    'approved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Approval Order',                  true),
    ('mutation', 'field_verification',    'rejected',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Rejection Order',                 true),
    ('mutation', 'field_verification',    'returned',              'officer', 'revenue',  'tahsildar',     'Return to Applicant',                            false),

    -- 2. SUCCESSION (Revenue Department: VRO -> RI -> Tahsildar)
    ('succession', 'returned',            'submitted',             'citizen', NULL,       NULL,            'Resubmit Application',                           false),
    ('succession', 'submitted',           'field_inspection',      'officer', 'revenue',  'vro',           'Conduct Legal Heir Field Inquiry',               false),
    ('succession', 'submitted',           'document_check',        'officer', 'revenue',  'vro',           'Verify Death Certificate & Family Tree',         false),
    ('succession', 'document_check',      'field_inspection',      'officer', 'revenue',  'vro',           'Conduct Legal Heir Ground Panchanama',           false),
    ('succession', 'field_inspection',    'scrutiny_review',       'officer', 'revenue',  'vro',           'Submit Legal Heir Panchanama to RI',             false),
    ('succession', 'scrutiny_review',     'statutory_sanction',    'officer', 'revenue',  'ri',            'RI Legal Heir Endorsement to Tahsildar',         false),
    ('succession', 'statutory_sanction',  'approved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Succession Order',                true),
    ('succession', 'statutory_sanction',  'rejected',              'officer', 'revenue',  'tahsildar',     'Reject Succession Claim',                        true),
    ('succession', 'statutory_sanction',  'returned',              'officer', 'revenue',  'tahsildar',     'Return for Missing Heir Documents',              false),
    ('succession', 'scrutiny_review',     'approved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Succession Order',                true),
    ('succession', 'scrutiny_review',     'rejected',              'officer', 'revenue',  'tahsildar',     'Reject Succession Claim',                        true),
    ('succession', 'scrutiny_review',     'returned',              'officer', 'revenue',  'tahsildar',     'Return for Missing Heir Documents',              false),

    -- 3. RECORD CORRECTION (Revenue Department: VRO -> Surveyor -> RI -> Tahsildar)
    ('record_correction', 'returned',              'submitted',             'citizen', NULL,       NULL,            'Resubmit Application',                   false),
    ('record_correction', 'submitted',             'field_inspection',      'officer', 'revenue',  'vro',           'Verify Ground Discrepancy & Old Records', false),
    ('record_correction', 'submitted',             'document_check',        'officer', 'revenue',  'vro',           'Scrutinize Old Record Extract & Khatas',  false),
    ('record_correction', 'document_check',        'field_inspection',      'officer', 'revenue',  'vro',           'VRO Field Verification',                 false),
    ('record_correction', 'field_inspection',      'boundary_demarcation',  'officer', 'revenue',  'vro',           'Forward to Surveyor for Cadastral Check', false),
    ('record_correction', 'boundary_demarcation',  'scrutiny_review',       'officer', 'revenue',  'surveyor',      'Submit FMB Cadastral Verification',       false),
    ('record_correction', 'scrutiny_review',       'statutory_sanction',    'officer', 'revenue',  'ri',            'RI Endorsement to Tahsildar',             false),
    ('record_correction', 'statutory_sanction',    'approved',              'officer', 'revenue',  'tahsildar',     'Pass Record Correction Order',            true),
    ('record_correction', 'statutory_sanction',    'rejected',              'officer', 'revenue',  'tahsildar',     'Reject Record Correction',                true),
    ('record_correction', 'statutory_sanction',    'returned',              'officer', 'revenue',  'tahsildar',     'Return for Original Records',            false),
    ('record_correction', 'scrutiny_review',       'approved',              'officer', 'revenue',  'tahsildar',     'Pass Record Correction Order',            true),
    ('record_correction', 'scrutiny_review',       'rejected',              'officer', 'revenue',  'tahsildar',     'Reject Record Correction',                true),

    -- 4. BOUNDARY CORRECTION (Revenue/Survey: Surveyor -> RI -> Tahsildar)
    ('boundary_correction', 'returned',              'submitted',             'citizen', NULL,       NULL,            'Resubmit Application',                   false),
    ('boundary_correction', 'submitted',             'geometry_check',        'officer', 'revenue',  'surveyor',      'Verify Cadastral Vertex Shift & FMB',     false),
    ('boundary_correction', 'geometry_check',        'boundary_demarcation',  'officer', 'revenue',  'surveyor',      'Conduct Ground Boundary Demarcation',     false),
    ('boundary_correction', 'boundary_demarcation',  'scrutiny_review',       'officer', 'revenue',  'surveyor',      'Submit Demarcated Polygon to RI',         false),
    ('boundary_correction', 'scrutiny_review',       'statutory_sanction',    'officer', 'revenue',  'ri',            'RI Neighbour Consent & Endorsement',      false),
    ('boundary_correction', 'statutory_sanction',    'approved',              'officer', 'revenue',  'tahsildar',     'Pass Boundary Revision Sanction',         true),
    ('boundary_correction', 'statutory_sanction',    'rejected',              'officer', 'revenue',  'tahsildar',     'Reject Boundary Revision',                true),
    ('boundary_correction', 'statutory_sanction',    'returned',              'officer', 'revenue',  'tahsildar',     'Return for Boundary Overlap Dispute',     false),
    ('boundary_correction', 'geometry_check',        'approved',              'officer', 'revenue',  'tahsildar',     'Pass Boundary Revision Sanction',         true),
    ('boundary_correction', 'geometry_check',        'rejected',              'officer', 'revenue',  'tahsildar',     'Reject Boundary Revision',                true),

    -- 5. BUILDING PERMISSION (Planning Department: Town Planner -> Surveyor -> Town Planner)
    ('building_permission', 'submitted',             'planning_check',        'officer', 'planning', 'town_planner',  'Run Planning & Zoning Scrutiny',          false),
    ('building_permission', 'planning_check',        'site_inspection',       'officer', 'planning', 'town_planner',  'Schedule On-site Measurement',           false),
    ('building_permission', 'site_inspection',       'scrutiny_review',       'officer', 'planning', 'surveyor',      'Submit Site Setback & Boundary Measurement', false),
    ('building_permission', 'scrutiny_review',        'approved',              'officer', 'planning', 'town_planner',  'Grant Building Permit Sanction',          true),
    ('building_permission', 'scrutiny_review',        'rejected',              'officer', 'planning', 'town_planner',  'Reject Building Permit',                 true),
    ('building_permission', 'site_inspection',       'approved',              'officer', 'planning', 'town_planner',  'Grant Building Permit Sanction',          true),
    ('building_permission', 'site_inspection',       'rejected',              'officer', 'planning', 'town_planner',  'Reject Building Permit',                 true),

    -- 6. LAND COMPLAINT (Revenue Grievance Redressal: RI -> VRO -> RI -> Tahsildar)
    ('land_complaint', 'submitted',           'in_review',             'officer', 'revenue',  'ri',            'RI Take up Grievance for Inquiry',        false),
    ('land_complaint', 'in_review',           'field_inspection',      'officer', 'revenue',  'vro',           'VRO Field Inquest & Verification',        false),
    ('land_complaint', 'field_inspection',    'scrutiny_review',       'officer', 'revenue',  'ri',            'RI Scrutiny & Action Taken Report',       false),
    ('land_complaint', 'scrutiny_review',     'resolved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Grievance Resolution',     true),
    ('land_complaint', 'scrutiny_review',     'dismissed',             'officer', 'revenue',  'tahsildar',     'Dismiss Grievance with Grounds',          true),
    ('land_complaint', 'in_review',           'resolved',              'officer', 'revenue',  'tahsildar',     'Pass Statutory Grievance Resolution',     true),
    ('land_complaint', 'in_review',           'dismissed',             'officer', 'revenue',  'tahsildar',     'Dismiss Grievance with Grounds',          true),

    -- 7. FIELD REVIEW (Admin -> Field Staff)
    ('field_review', 'open',                  'assigned',              'admin',   NULL,       NULL,            'Assign Field Review',                    false),
    ('field_review', 'assigned',              'resolved',              'officer', 'revenue',  'vro',           'VRO Mark Ground Truth Verified',          true),
    ('field_review', 'assigned',              'resolved',              'officer', 'revenue',  'surveyor',      'Surveyor Mark Demarcation Verified',      true),
    ('field_review', 'assigned',              'resolved',              'officer', 'planning', 'town_planner',  'Planning Mark Verified',                  true);
