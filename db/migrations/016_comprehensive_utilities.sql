-- 016_comprehensive_utilities.sql
-- Comprehensive municipal utility infrastructure & service connection tracking
-- Supports Electricity (DISCOM), Water Supply, Sewerage (UGD), Piped Gas (PNG),
-- Telecom/OFC Fiber, Rainwater Harvesting & Sanitation, plus utility_request workflow.

ALTER TABLE dept_utilities.connections
    ADD COLUMN IF NOT EXISTS gas                      boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS broadband                boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS rainwater_harvesting     boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS solid_waste_mgmt         boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS electricity_details      jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS water_details            jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sewer_details            jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS gas_details              jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS broadband_details        jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sanitation_details       jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS history                  jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at               timestamptz NOT NULL DEFAULT now();

-- Update existing parcels with rich utility data
WITH numbered AS (
    SELECT
        p.ulpin,
        p.state,
        p.village,
        p.taluk,
        p.zone_code,
        ROW_NUMBER() OVER (ORDER BY p.ulpin) AS rn
    FROM landstack.parcels p
)
UPDATE dept_utilities.connections u
SET
    gas = true,
    broadband = true,
    rainwater_harvesting = true,
    solid_waste_mgmt = true,
    electricity_details = jsonb_build_object(
        'consumer_no', 'USC-' || UPPER(SUBSTRING(n.ulpin FROM 1 FOR 6)) || '-01',
        'provider', CASE
            WHEN n.state = 'TN' THEN 'TANGEDCO (Tamil Nadu Generation and Distribution Corp)'
            WHEN n.state = 'TG' THEN 'TSSPDCL (Southern Power Distribution Co. of Telangana)'
            ELSE 'APCPDCL (Central Power Distribution Corp of AP)'
        END,
        'tariff_category', CASE WHEN n.zone_code = 'C1' THEN 'LT-II Commercial' ELSE 'LT-I Domestic' END,
        'sanctioned_load_kw', CASE WHEN n.zone_code = 'C1' THEN 15.0 ELSE 5.0 END,
        'phase', CASE WHEN n.zone_code = 'C1' THEN '3-Phase' ELSE '1-Phase' END,
        'meter_no', 'MTR-' || LPAD(n.rn::text, 6, '0'),
        'status', 'active',
        'connection_date', '2021-06-15',
        'feeder_name', n.village || ' Local Feeder-1',
        'transformer_id', 'DTR-' || UPPER(SUBSTRING(n.ulpin FROM 1 FOR 4)) || '-A'
    ),
    water_details = jsonb_build_object(
        'consumer_no', 'CAN-' || UPPER(SUBSTRING(n.ulpin FROM 7 FOR 5)) || '-W',
        'provider', n.taluk || ' Municipal Water Supply & Sewerage Board',
        'connection_type', 'Domestic Piped Water Supply',
        'pipe_size_mm', 15,
        'meter_no', 'WM-' || LPAD(n.rn::text, 5, '0'),
        'status', 'active',
        'supply_hours', '06:00 - 08:30 (Morning) & 17:30 - 19:30 (Evening)',
        'water_quality_index', 'Potable Municipal Standards (TDS 195 mg/L)',
        'connection_date', '2020-11-20'
    ),
    sewer_details = jsonb_build_object(
        'connection_no', 'UGD-' || UPPER(SUBSTRING(n.ulpin FROM 1 FOR 5)) || '-S',
        'network_type', 'Underground Drainage (UGD)',
        'nearest_manhole_distance_m', 7.5,
        'status', 'connected',
        'chamber_inspection', 'clear_pass',
        'maintenance_ward', n.taluk || ' Municipal Ward-04'
    ),
    gas_details = jsonb_build_object(
        'bp_no', 'PNG-' || UPPER(SUBSTRING(n.ulpin FROM 3 FOR 5)) || '-G',
        'provider', CASE
            WHEN n.state = 'TG' THEN 'Bhagyanagar Gas Ltd (BGL)'
            WHEN n.state = 'TN' THEN 'Torrent Gas Chennai Ltd'
            ELSE 'Godavari Gas Ltd / AG&P Pratham'
        END,
        'status', 'active',
        'meter_no', 'GM-' || LPAD(n.rn::text, 5, '0'),
        'connection_type', 'Domestic Piped Natural Gas (PNG)'
    ),
    broadband_details = jsonb_build_object(
        'status', 'active',
        'infrastructure', 'Underground Fiber Optic Micro-Duct (OFC)',
        'available_isps', '["BSNL Bharat Fiber", "JioFiber", "Airtel Xstream"]'::jsonb,
        'max_speed_available', '1 Gbps Gigabit FTTH',
        'nearest_junction_box', 'JB-' || UPPER(SUBSTRING(n.ulpin FROM 1 FOR 5)) || '-01'
    ),
    sanitation_details = jsonb_build_object(
        'sanitation_qr', 'SWM-' || n.state || '-' || UPPER(SUBSTRING(n.ulpin FROM 1 FOR 6)),
        'collection_tier', 'Daily Door-to-Door Municipal Pickup',
        'waste_segregation', 'Compliant (Wet / Dry / Domestic Hazardous)',
        'sanitary_inspector_ward', 'Ward Inspector Area-A'
    )
FROM numbered n
WHERE n.ulpin = u.ulpin;

-- Specific customization for Jatin barali's parcel (Survey 126, TFCM916196F0FE)
UPDATE dept_utilities.connections
SET
    water = true,
    electricity = true,
    sewer = true,
    gas = true,
    broadband = true,
    rainwater_harvesting = true,
    solid_waste_mgmt = true,
    road_access_m = 12.5,
    nearest_road_class = 'district',
    electricity_details = '{
        "consumer_no": "USC-1092842",
        "consumer_name": "Jatin barali",
        "provider": "APCPDCL - Southern Power Distribution",
        "tariff_category": "LT-I Domestic",
        "sanctioned_load_kw": 5.0,
        "phase": "3-Phase",
        "meter_no": "AP-MTR-882194",
        "connection_date": "2021-04-12",
        "status": "active",
        "last_reading_kwh": 3420,
        "feeder_name": "Mangalagiri Town-2 Feeder",
        "transformer_id": "DTR-MG-14",
        "nearest_pole_no": "AP-POLE-MG-126/A"
    }'::jsonb,
    water_details = '{
        "consumer_no": "CAN-441029",
        "consumer_name": "Jatin barali",
        "provider": "Mangalagiri Municipal Water Works",
        "connection_type": "Domestic Piped Water Supply",
        "pipe_size_mm": 15,
        "meter_no": "WM-301924",
        "status": "active",
        "supply_hours": "06:00 - 08:30 (Morning) & 17:30 - 19:30 (Evening)",
        "water_quality_index": "Potable (TDS 210 mg/L)",
        "connection_date": "2020-08-15"
    }'::jsonb,
    sewer_details = '{
        "connection_no": "UGD-7712",
        "network_type": "Underground Drainage (UGD)",
        "nearest_manhole_distance_m": 8.5,
        "status": "connected",
        "chamber_inspection": "clear_pass",
        "maintenance_ward": "Ward 12, Mangalagiri ULB"
    }'::jsonb,
    gas_details = '{
        "bp_no": "PNG-66291",
        "consumer_name": "Jatin barali",
        "provider": "Bhagyanagar Gas Ltd (BGL)",
        "status": "active",
        "meter_no": "GM-991204",
        "connection_type": "Domestic PNG",
        "line_pressure_bar": 0.021
    }'::jsonb,
    broadband_details = '{
        "status": "active",
        "infrastructure": "Underground Fiber Optic Micro-Duct (OFC)",
        "available_isps": ["BSNL Bharat Fiber", "JioFiber", "Airtel Xstream"],
        "max_speed_available": "1 Gbps Gigabit FTTH",
        "nearest_junction_box": "JB-MG-ROAD-04"
    }'::jsonb,
    sanitation_details = '{
        "sanitation_qr": "SWM-AP-MG-126",
        "collection_tier": "Daily Door-to-Door Municipal Pickup",
        "waste_segregation": "Compliant (Wet / Dry / Sanitary)",
        "supervisor_contact": "Sanitary Inspector Ward-12",
        "rwh_pit_status": "certified_compliant",
        "rwh_capacity_liters": 12000
    }'::jsonb,
    history = '[{
        "date": "2026-09-23",
        "action": "name_transfer",
        "utility_type": "all",
        "consumer_name": "Jatin barali",
        "remark": "Statutory name update synced from Record of Rights (APP-2026-000018)"
    }]'::jsonb
WHERE ulpin = 'TFCM916196F0FE';

-- Workflow support for utility_request
ALTER TABLE landstack.applications DROP CONSTRAINT IF EXISTS applications_type_check;
ALTER TABLE landstack.applications ADD CONSTRAINT applications_type_check
    CHECK (type IN ('mutation', 'building_permission', 'ownership_verification', 'field_review',
                    'boundary_correction', 'record_correction', 'land_complaint', 'succession',
                    'utility_request'));

INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, allowed_designation, action_label, is_terminal)
SELECT v.type, v.from_status, v.to_status, v.allowed_role, v.allowed_department, v.allowed_designation, v.action_label, v.is_terminal
FROM (VALUES
    ('utility_request', 'returned',        'submitted',        'citizen', NULL,       NULL,            'Resubmit Utility Request',                 false),
    ('utility_request', 'submitted',       'in_review',        'officer', 'revenue',  'vro',           'VRO Verify Ground Feasibility',            false),
    ('utility_request', 'submitted',       'site_inspection',  'officer', 'revenue',  'surveyor',      'Surveyor Verify Service Line Alignment',   false),
    ('utility_request', 'in_review',       'site_inspection',  'officer', 'revenue',  'surveyor',      'Surveyor Verify Service Line Alignment',   false),
    ('utility_request', 'site_inspection', 'scrutiny_review',  'officer', 'revenue',  'ri',            'RI Endorsement to Competent Authority',    false),
    ('utility_request', 'scrutiny_review', 'approved',         'officer', 'revenue',  'tahsildar',     'Sanction Utility Connection / Modification', true),
    ('utility_request', 'scrutiny_review', 'rejected',         'officer', 'revenue',  'tahsildar',     'Reject Utility Request',                   true),
    ('utility_request', 'in_review',       'approved',         'officer', 'revenue',  'tahsildar',     'Sanction Utility Connection / Modification', true),
    ('utility_request', 'in_review',       'rejected',         'officer', 'revenue',  'tahsildar',     'Reject Utility Request',                   true),
    ('utility_request', 'submitted',       'approved',         'admin',   NULL,       NULL,            'Admin Fast-Track Approval',                true)
) AS v(type, from_status, to_status, allowed_role, allowed_department, allowed_designation, action_label, is_terminal)
WHERE NOT EXISTS (
    SELECT 1 FROM landstack.transitions t
    WHERE t.type = v.type AND t.from_status = v.from_status AND t.to_status = v.to_status
);
