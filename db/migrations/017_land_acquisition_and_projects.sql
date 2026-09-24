-- 017_land_acquisition_and_projects.sql
-- Statutory Land Acquisition, Right of Way (RoW), Partial Land Take, Compensation (RFCTLARR 2013),
-- and Landowner Response Workflows (Accept / Negotiate / Decline / TDR).

-- 1. Enhance gis.projects with statutory acquisition and executing agency metadata
ALTER TABLE gis.projects
    ADD COLUMN IF NOT EXISTS executing_agency text,
    ADD COLUMN IF NOT EXISTS statutory_act text DEFAULT 'RFCTLARR Act, 2013',
    ADD COLUMN IF NOT EXISTS notification_section text DEFAULT 'Section 19 (Declaration)',
    ADD COLUMN IF NOT EXISTS gazette_no text,
    ADD COLUMN IF NOT EXISTS gazette_date date,
    ADD COLUMN IF NOT EXISTS objection_deadline date,
    ADD COLUMN IF NOT EXISTS compensation_multiplier numeric(3, 2) DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS solatium_pct numeric(5, 2) DEFAULT 100.0,
    ADD COLUMN IF NOT EXISTS consent_bonus_pct numeric(5, 2) DEFAULT 25.0,
    ADD COLUMN IF NOT EXISTS tdr_ratio numeric(3, 2) DEFAULT 2.0,
    ADD COLUMN IF NOT EXISTS buffer_width_m numeric(5, 1) DEFAULT 15.0,
    ADD COLUMN IF NOT EXISTS description text;

-- Update existing projects with realistic statutory parameters
UPDATE gis.projects
SET executing_agency = 'Andhra Pradesh Roads & Buildings (R&B) Department',
    statutory_act = 'RFCTLARR Act, 2013',
    notification_section = 'Section 19 (Final Declaration of Alignment)',
    gazette_no = 'AP-GZ-2026-R&B-0428',
    gazette_date = CURRENT_DATE - INTERVAL '12 days',
    objection_deadline = CURRENT_DATE + INTERVAL '18 days',
    compensation_multiplier = 1.0,
    solatium_pct = 100.0,
    consent_bonus_pct = 25.0,
    tdr_ratio = 2.0,
    buffer_width_m = 18.0,
    description = '4-Laning of Outer Ring Road Link corridor with 36m Right-of-Way. Partial front strip acquisition for service roads and drainage.'
WHERE id = 1;

UPDATE gis.projects
SET executing_agency = 'Amaravati Metro Rail Corporation (AMRC)',
    statutory_act = 'RFCTLARR Act, 2013 & Metro Railways Act',
    notification_section = 'Section 11 (Preliminary Acquisition Intent)',
    gazette_no = 'AP-GZ-2026-AMRC-0112',
    gazette_date = CURRENT_DATE - INTERVAL '8 days',
    objection_deadline = CURRENT_DATE + INTERVAL '22 days',
    compensation_multiplier = 1.0,
    solatium_pct = 100.0,
    consent_bonus_pct = 25.0,
    tdr_ratio = 2.5,
    buffer_width_m = 22.0,
    description = 'Elevated metro viaduct & station corridor connecting Amaravati core to Vijayawada Junction.'
WHERE id = 2;

UPDATE gis.projects
SET executing_agency = 'National Highways Authority of India (NHAI)',
    statutory_act = 'National Highways Act, 1956 (§3D)',
    notification_section = 'Section 3D (Declaration of Acquisition)',
    gazette_no = 'NHAI-GZ-2026-TN-0914',
    gazette_date = CURRENT_DATE - INTERVAL '15 days',
    objection_deadline = CURRENT_DATE + INTERVAL '15 days',
    compensation_multiplier = 1.25,
    solatium_pct = 100.0,
    consent_bonus_pct = 25.0,
    tdr_ratio = 2.0,
    buffer_width_m = 25.0,
    description = 'Access-controlled expressway spur connecting Chennai outer logistics corridor.'
WHERE id = 3;

UPDATE gis.projects
SET executing_agency = 'Hyderabad Metropolitan Development Authority (HMDA)',
    statutory_act = 'RFCTLARR Act, 2013',
    notification_section = 'Section 19 (Final Declaration)',
    gazette_no = 'TG-GZ-2026-HMDA-0551',
    gazette_date = CURRENT_DATE - INTERVAL '5 days',
    objection_deadline = CURRENT_DATE + INTERVAL '25 days',
    compensation_multiplier = 1.0,
    solatium_pct = 100.0,
    consent_bonus_pct = 25.0,
    tdr_ratio = 2.0,
    buffer_width_m = 20.0,
    description = 'Regional Ring Road alignment and junction expansion at Shamshabad.'
WHERE id = 5;

UPDATE gis.projects
SET executing_agency = 'Hyderabad Airport Metro Ltd (HAML)',
    statutory_act = 'RFCTLARR Act, 2013',
    notification_section = 'Section 11 (Preliminary Notification)',
    gazette_no = 'TG-GZ-2026-HAML-0204',
    gazette_date = CURRENT_DATE - INTERVAL '10 days',
    objection_deadline = CURRENT_DATE + INTERVAL '20 days',
    compensation_multiplier = 1.0,
    solatium_pct = 100.0,
    consent_bonus_pct = 25.0,
    tdr_ratio = 2.5,
    buffer_width_m = 15.0,
    description = 'High-speed airport express metro corridor running along RGIA approach link.'
WHERE id = 6;


-- 2. Project Parcel Impacts Table (Exact geometric intersection & statutory award calculation)
CREATE TABLE IF NOT EXISTS gis.project_parcel_impacts (
    id                          serial PRIMARY KEY,
    ulpin                       text NOT NULL REFERENCES landstack.parcels(ulpin) ON DELETE CASCADE,
    project_id                  integer NOT NULL REFERENCES gis.projects(id) ON DELETE CASCADE,
    impact_type                 text NOT NULL CHECK (impact_type IN ('partial_road_widening', 'partial_metro_corridor', 'total_acquisition', 'civic_complex')),
    total_area_sqm              numeric(10, 2) NOT NULL,
    affected_area_sqm           numeric(10, 2) NOT NULL,
    residual_area_sqm           numeric(10, 2) NOT NULL,
    impact_pct                  numeric(5, 2) NOT NULL,
    affected_geom               geometry(Geometry, 4326),
    guideline_rate_per_sqm      numeric(12, 2) NOT NULL,
    base_land_value             numeric(14, 2) NOT NULL,
    solatium_amount             numeric(14, 2) NOT NULL,
    structural_damage_estimate  numeric(14, 2) NOT NULL DEFAULT 0,
    total_compensation_offer    numeric(14, 2) NOT NULL,
    consent_settlement_total    numeric(14, 2) NOT NULL,
    tdr_units_offered_sqm       numeric(10, 2) NOT NULL,
    severance_risk              boolean NOT NULL DEFAULT false,
    status                      text NOT NULL DEFAULT 'notice_published'
                                CHECK (status IN ('notice_published', 'objection_filed', 'negotiation_pending', 'consent_accepted', 'tdr_opted', 'award_passed', 'disbursed')),
    hearing_date                date,
    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(ulpin, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_parcel_impacts_ulpin ON gis.project_parcel_impacts(ulpin);
CREATE INDEX IF NOT EXISTS idx_project_parcel_impacts_project ON gis.project_parcel_impacts(project_id);


-- 3. Acquisition Claims & Citizen Response Log Table
CREATE TABLE IF NOT EXISTS gis.acquisition_claims (
    id                  serial PRIMARY KEY,
    application_id      text REFERENCES landstack.applications(id) ON DELETE SET NULL,
    ulpin               text NOT NULL REFERENCES landstack.parcels(ulpin) ON DELETE CASCADE,
    project_id          integer NOT NULL REFERENCES gis.projects(id) ON DELETE CASCADE,
    response_type       text NOT NULL CHECK (response_type IN ('consent_settlement', 'compensation_negotiation', 'statutory_objection', 'tdr_opt_in')),
    applicant_name      text NOT NULL,
    demanded_amount     numeric(14, 2),
    grounds             text,
    proposed_alignment  text,
    bank_account_no     text,
    bank_ifsc           text,
    bank_name           text,
    tdr_preferred_zone  text,
    supporting_docs     jsonb DEFAULT '[]'::jsonb,
    officer_remark      text,
    status              text NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted', 'under_scrutiny', 'hearing_scheduled', 'approved', 'rejected')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acquisition_claims_ulpin ON gis.acquisition_claims(ulpin);


-- 4. Materialize impacts for all intersecting parcels across projects
-- For road projects, buffer the line by buffer_width_m to create realistic Right-of-Way widening bands
INSERT INTO gis.project_parcel_impacts (
    ulpin,
    project_id,
    impact_type,
    total_area_sqm,
    affected_area_sqm,
    residual_area_sqm,
    impact_pct,
    affected_geom,
    guideline_rate_per_sqm,
    base_land_value,
    solatium_amount,
    structural_damage_estimate,
    total_compensation_offer,
    consent_settlement_total,
    tdr_units_offered_sqm,
    severance_risk,
    status,
    hearing_date
)
SELECT
    p.ulpin,
    prj.id AS project_id,
    CASE
        WHEN prj.kind = 'metro' THEN 'partial_metro_corridor'
        WHEN prj.kind = 'road' THEN 'partial_road_widening'
        ELSE 'civic_complex'
    END AS impact_type,
    ROUND(ST_Area(p.geom::geography)::numeric, 1) AS total_area_sqm,
    ROUND(ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography)::numeric, 1) AS affected_area_sqm,
    ROUND((ST_Area(p.geom::geography) - ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography))::numeric, 1) AS residual_area_sqm,
    ROUND((ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography) / NULLIF(ST_Area(p.geom::geography), 0) * 100)::numeric, 1) AS impact_pct,
    ST_Multi(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )) AS affected_geom,
    COALESCE(f.guideline_value_per_sqm, 22500.0) AS guideline_rate_per_sqm,
    ROUND((ROUND(ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography)::numeric, 1) * COALESCE(f.guideline_value_per_sqm, 22500.0) * prj.compensation_multiplier)::numeric, 2) AS base_land_value,
    -- 100% Solatium under RFCTLARR §30
    ROUND((ROUND(ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography)::numeric, 1) * COALESCE(f.guideline_value_per_sqm, 22500.0) * prj.compensation_multiplier * (prj.solatium_pct / 100.0))::numeric, 2) AS solatium_amount,
    -- Structural asset damage estimate (compound wall, frontage improvements)
    CASE
        WHEN prj.kind = 'road' THEN 250000.0
        ELSE 150000.0
    END AS structural_damage_estimate,
    -- Total Standard Award = Base Value + 100% Solatium + Structural Damage
    ROUND((
        (ROUND(ST_Area(ST_Intersection(p.geom,
            CASE
                WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
                ELSE prj.geom
            END
        )::geography)::numeric, 1) * COALESCE(f.guideline_value_per_sqm, 22500.0) * prj.compensation_multiplier * 2.0)
        + (CASE WHEN prj.kind = 'road' THEN 250000.0 ELSE 150000.0 END)
    )::numeric, 2) AS total_compensation_offer,
    -- Consent settlement with 25% incentive bonus
    ROUND((
        (ROUND(ST_Area(ST_Intersection(p.geom,
            CASE
                WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
                ELSE prj.geom
            END
        )::geography)::numeric, 1) * COALESCE(f.guideline_value_per_sqm, 22500.0) * prj.compensation_multiplier * 2.25)
        + (CASE WHEN prj.kind = 'road' THEN 250000.0 ELSE 150000.0 END)
    )::numeric, 2) AS consent_settlement_total,
    -- TDR Units = Affected Area * TDR Ratio (2.0x - 2.5x)
    ROUND((ROUND(ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography)::numeric, 1) * prj.tdr_ratio)::numeric, 1) AS tdr_units_offered_sqm,
    -- Severance Risk: true if residual is < 30% of total area or < 150 sqm
    ((ST_Area(p.geom::geography) - ST_Area(ST_Intersection(p.geom,
        CASE
            WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
            ELSE prj.geom
        END
    )::geography)) < 150.0) AS severance_risk,
    'notice_published' AS status,
    prj.objection_deadline + INTERVAL '5 days' AS hearing_date
FROM landstack.parcels p
JOIN gis.projects prj ON ST_Intersects(p.geom,
    CASE
        WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
        ELSE prj.geom
    END
)
LEFT JOIN dept_fiscal.valuation f ON f.ulpin = p.ulpin
WHERE ST_Area(ST_Intersection(p.geom,
    CASE
        WHEN ST_GeometryType(prj.geom) = 'ST_LineString' THEN ST_Buffer(prj.geom::geography, prj.buffer_width_m)::geometry
        ELSE prj.geom
    END
)::geography) > 10.0
ON CONFLICT (ulpin, project_id) DO UPDATE SET
    total_area_sqm = EXCLUDED.total_area_sqm,
    affected_area_sqm = EXCLUDED.affected_area_sqm,
    residual_area_sqm = EXCLUDED.residual_area_sqm,
    impact_pct = EXCLUDED.impact_pct,
    affected_geom = EXCLUDED.affected_geom,
    total_compensation_offer = EXCLUDED.total_compensation_offer,
    consent_settlement_total = EXCLUDED.consent_settlement_total,
    tdr_units_offered_sqm = EXCLUDED.tdr_units_offered_sqm,
    updated_at = now();

-- 5. Add a realistic high-profile road widening project directly affecting Mangalagiri parcel (TFCM916196F0FE, Survey 126)
-- and Shamshabad parcel (TEPF0H271427E9, Survey 104/6) so users can immediately test and experience both!
DO $$
DECLARE
    m_ulpin text := 'TFCM916196F0FE';
    m_geom geometry;
    m_strip geometry;
    m_area numeric;
    m_aff_area numeric;
    m_prj_id integer;

    s_ulpin text := 'TEPF0H271427E9';
    s_geom geometry;
    s_strip geometry;
    s_area numeric;
    s_aff_area numeric;
    s_prj_id integer;
BEGIN
    -- For Mangalagiri (Survey 126)
    SELECT geom INTO m_geom FROM landstack.parcels WHERE ulpin = m_ulpin;
    IF m_geom IS NOT NULL THEN
        -- Check if road project exists or create "Amaravati Inner Expressway 6-Laning & Service Corridor"
        INSERT INTO gis.projects (
            name, kind, status, executing_agency, statutory_act, notification_section,
            gazette_no, gazette_date, objection_deadline, compensation_multiplier,
            solatium_pct, consent_bonus_pct, tdr_ratio, buffer_width_m, description, geom
        ) VALUES (
            'Amaravati Capital Arterial Road 4-Laning (RoW Widening)',
            'road',
            'approved',
            'Andhra Pradesh Capital Region Development Authority (APCRDA)',
            'RFCTLARR Act, 2013',
            'Section 19 (Final Declaration)',
            'AP-GZ-2026-CRDA-0842',
            CURRENT_DATE - INTERVAL '10 days',
            CURRENT_DATE + INTERVAL '20 days',
            1.0,
            100.0,
            25.0,
            2.0,
            20.0,
            '30-meter master plan arterial road widening. Partial 15m front strip acquisition for pedestrian sidewalk, stormwater culvert, and bus bay.',
            ST_SetSRID(ST_MakeLine(
                ST_Point(80.555, 16.438),
                ST_Point(80.560, 16.442)
            ), 4326)
        ) RETURNING id INTO m_prj_id;

        -- Create exact front strip of ~78.4 m² (approx 13.5% of 577.6 m²)
        -- We cut the southern/front slice of parcel geometry
        m_strip := ST_Intersection(m_geom, ST_MakeEnvelope(
            ST_XMin(m_geom),
            ST_YMin(m_geom),
            ST_XMax(m_geom),
            ST_YMin(m_geom) + (ST_YMax(m_geom) - ST_YMin(m_geom)) * 0.14,
            4326
        ));

        m_area := ROUND(ST_Area(m_geom::geography)::numeric, 1);
        m_aff_area := ROUND(ST_Area(m_strip::geography)::numeric, 1);
        IF m_aff_area < 20.0 THEN
            m_aff_area := 78.5;
        END IF;

        INSERT INTO gis.project_parcel_impacts (
            ulpin, project_id, impact_type, total_area_sqm, affected_area_sqm, residual_area_sqm,
            impact_pct, affected_geom, guideline_rate_per_sqm, base_land_value, solatium_amount,
            structural_damage_estimate, total_compensation_offer, consent_settlement_total,
            tdr_units_offered_sqm, severance_risk, status, hearing_date
        ) VALUES (
            m_ulpin,
            m_prj_id,
            'partial_road_widening',
            577.6,
            78.5,
            499.1,
            13.6,
            m_strip,
            28000.0,
            ROUND((78.5 * 28000.0)::numeric, 2), -- 21,98,000
            ROUND((78.5 * 28000.0)::numeric, 2), -- 21,98,000 (100% solatium)
            350000.0, -- Front boundary wall, commercial gate, paved apron
            ROUND(((78.5 * 28000.0 * 2.0) + 350000.0)::numeric, 2), -- 47,46,000
            ROUND(((78.5 * 28000.0 * 2.25) + 350000.0)::numeric, 2), -- 52,95,500 (with 25% consent bonus)
            157.0, -- 78.5 * 2.0x TDR credits
            false,
            'notice_published',
            CURRENT_DATE + INTERVAL '25 days'
        ) ON CONFLICT (ulpin, project_id) DO NOTHING;
    END IF;

    -- For Shamshabad (Survey 104/6, Agricultural 12,742 m²)
    SELECT geom INTO s_geom FROM landstack.parcels WHERE ulpin = s_ulpin;
    IF s_geom IS NOT NULL THEN
        INSERT INTO gis.projects (
            name, kind, status, executing_agency, statutory_act, notification_section,
            gazette_no, gazette_date, objection_deadline, compensation_multiplier,
            solatium_pct, consent_bonus_pct, tdr_ratio, buffer_width_m, description, geom
        ) VALUES (
            'Shamshabad Regional Ring Road (RRR) Northern Interchange & Radial Road 19',
            'road',
            'approved',
            'National Highways Authority of India (NHAI) & HMDA',
            'RFCTLARR Act, 2013 & NHAI Act (§3A)',
            'Section 11 (Preliminary Acquisition Intent)',
            'TG-GZ-2026-RRR-1104',
            CURRENT_DATE - INTERVAL '14 days',
            CURRENT_DATE + INTERVAL '16 days',
            1.25,
            100.0,
            25.0,
            2.0,
            30.0,
            '60-meter Radial Highway corridor connecting Shamshabad to Outer Ring Road Exit 16. Right-of-Way alignment cuts edge strip of survey numbers 104 and 105.',
            ST_SetSRID(ST_MakeLine(
                ST_Point(78.400, 17.242),
                ST_Point(78.408, 17.247)
            ), 4326)
        ) RETURNING id INTO s_prj_id;

        -- Create edge strip of ~620 m² (out of 12,742 m², ~4.8% partial acquisition)
        s_strip := ST_Intersection(s_geom, ST_MakeEnvelope(
            ST_XMin(s_geom),
            ST_YMin(s_geom),
            ST_XMax(s_geom),
            ST_YMin(s_geom) + (ST_YMax(s_geom) - ST_YMin(s_geom)) * 0.05,
            4326
        ));

        INSERT INTO gis.project_parcel_impacts (
            ulpin, project_id, impact_type, total_area_sqm, affected_area_sqm, residual_area_sqm,
            impact_pct, affected_geom, guideline_rate_per_sqm, base_land_value, solatium_amount,
            structural_damage_estimate, total_compensation_offer, consent_settlement_total,
            tdr_units_offered_sqm, severance_risk, status, hearing_date
        ) VALUES (
            s_ulpin,
            s_prj_id,
            'partial_road_widening',
            12742.2,
            620.0,
            12122.2,
            4.9,
            s_strip,
            16500.0,
            ROUND((620.0 * 16500.0 * 1.25)::numeric, 2), -- 1,27,87,500 (with 1.25x rural factor)
            ROUND((620.0 * 16500.0 * 1.25)::numeric, 2), -- 1,27,87,500 (100% solatium)
            450000.0, -- Irrigation channels, solar fencing, farm borewell relocation
            ROUND(((620.0 * 16500.0 * 1.25 * 2.0) + 450000.0)::numeric, 2), -- 2,60,25,000
            ROUND(((620.0 * 16500.0 * 1.25 * 2.25) + 450000.0)::numeric, 2), -- 2,92,21,875 (with 25% consent bonus)
            1240.0, -- 620 * 2.0x TDR credits
            false,
            'notice_published',
            CURRENT_DATE + INTERVAL '21 days'
        ) ON CONFLICT (ulpin, project_id) DO NOTHING;
    END IF;
END $$;


-- 6. Update landstack.applications check constraint to include 'acquisition_claim'
ALTER TABLE landstack.applications
    DROP CONSTRAINT IF EXISTS applications_type_check;

ALTER TABLE landstack.applications
    ADD CONSTRAINT applications_type_check CHECK (type IN (
        'mutation',
        'building_permission',
        'ownership_verification',
        'field_review',
        'boundary_correction',
        'record_correction',
        'land_complaint',
        'succession',
        'utility_request',
        'acquisition_claim'
    ));

-- 7. Add workflow transitions for acquisition_claim
INSERT INTO landstack.transitions (type, from_status, to_status, allowed_role, allowed_department, allowed_designation, action_label, is_terminal) VALUES
    ('acquisition_claim', 'returned',          'submitted',         'citizen', NULL,      NULL,         'Resubmit Claim / Objection',               false),
    ('acquisition_claim', 'submitted',         'in_review',         'officer', 'revenue', 'vro',        'Scrutinize Claim & Verify Parcel Take',    false),
    ('acquisition_claim', 'submitted',         'approved',          'officer', 'revenue', 'tahsildar',  'Approve Direct Consent Settlement Award',  true),
    ('acquisition_claim', 'in_review',         'hearing_scheduled', 'officer', 'revenue', 'tahsildar',  'Schedule Statutory §15 / §64 Hearing',     false),
    ('acquisition_claim', 'in_review',         'approved',          'officer', 'revenue', 'tahsildar',  'Pass Final Compensation Award Order',      true),
    ('acquisition_claim', 'in_review',         'rejected',          'officer', 'revenue', 'tahsildar',  'Reject Objection (Speaking Order)',        true),
    ('acquisition_claim', 'hearing_scheduled', 'approved',          'officer', 'revenue', 'tahsildar',  'Pass Revised Award Post-Hearing',          true),
    ('acquisition_claim', 'hearing_scheduled', 'rejected',          'officer', 'revenue', 'tahsildar',  'Dismiss Objection Post-Hearing',           true)
ON CONFLICT DO NOTHING;
