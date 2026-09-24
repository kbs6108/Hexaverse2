-- 015_dynamic_land_pricing.sql
-- Implements dynamic, place-specific land pricing (guideline circle rate & fair market value)
-- based on location (village/district/state), road classification & width, infrastructure connectivity, and zoning.

ALTER TABLE dept_fiscal.valuation
    ADD COLUMN IF NOT EXISTS market_value_per_sqm  numeric(12, 2),
    ADD COLUMN IF NOT EXISTS base_rate_per_sqm     numeric(12, 2),
    ADD COLUMN IF NOT EXISTS road_factor           numeric(4, 2),
    ADD COLUMN IF NOT EXISTS infra_factor          numeric(4, 2),
    ADD COLUMN IF NOT EXISTS zone_factor           numeric(4, 2),
    ADD COLUMN IF NOT EXISTS location_tier         text;

-- Update valuations dynamically based on parcel location, road class, and infrastructure
WITH factors AS (
    SELECT
        p.ulpin,
        -- 1. Base rate per place / village
        CASE
            WHEN p.village ILIKE '%Shamshabad%' OR p.district ILIKE '%Ranga Reddy%' THEN 26000.00
            WHEN p.village ILIKE '%Mangalagiri%' OR p.district ILIKE '%Guntur%' THEN 16500.00
            WHEN p.village ILIKE '%Sriperumbudur%' OR p.district ILIKE '%Kancheepuram%' THEN 14500.00
            ELSE 12500.00
        END AS base_rate,

        -- 2. Zoning factor
        CASE
            WHEN p.zone_code = 'C1'  THEN 2.05
            WHEN p.zone_code = 'R1'  THEN 1.40
            WHEN p.zone_code = 'R2'  THEN 1.00
            WHEN p.zone_code = 'IND' THEN 1.20
            WHEN p.zone_code = 'AG'  THEN 0.22
            WHEN p.zone_code = 'PUB' THEN 0.75
            ELSE 1.00
        END AS z_factor,

        -- 3. Road class factor
        CASE
            WHEN COALESCE(u.nearest_road_class, 'village') = 'national' THEN 1.45
            WHEN COALESCE(u.nearest_road_class, 'village') = 'state'    THEN 1.28
            WHEN COALESCE(u.nearest_road_class, 'village') = 'district' THEN 1.15
            WHEN COALESCE(u.nearest_road_class, 'village') = 'lane'     THEN 0.90
            ELSE 1.00
        END + (CASE WHEN COALESCE(u.road_access_m, 0) >= 24 THEN 0.05 ELSE 0.0 END) AS r_factor,

        -- 4. Utility infrastructure factor
        CASE
            WHEN COALESCE(u.water, false) AND COALESCE(u.electricity, false) AND COALESCE(u.sewer, false) THEN 1.15
            WHEN (CASE WHEN COALESCE(u.water, false) THEN 1 ELSE 0 END +
                  CASE WHEN COALESCE(u.electricity, false) THEN 1 ELSE 0 END +
                  CASE WHEN COALESCE(u.sewer, false) THEN 1 ELSE 0 END) = 2 THEN 1.08
            WHEN (CASE WHEN COALESCE(u.water, false) THEN 1 ELSE 0 END +
                  CASE WHEN COALESCE(u.electricity, false) THEN 1 ELSE 0 END +
                  CASE WHEN COALESCE(u.sewer, false) THEN 1 ELSE 0 END) = 1 THEN 1.03
            ELSE 0.96
        END AS i_factor,

        -- 5. Micro-location variance (-6% to +6% to reflect local block/frontage variations)
        (1.0 + (((abs(hashtext(p.ulpin)) % 13) - 6.0) / 100.0)) AS m_factor,

        -- 6. Human-readable location tier
        CASE
            WHEN COALESCE(u.nearest_road_class, '') = 'national' THEN 'National Highway Commercial Belt'
            WHEN COALESCE(u.nearest_road_class, '') = 'state' THEN 'State Highway Growth Corridor'
            WHEN p.zone_code = 'C1' THEN 'Urban Commercial District'
            WHEN p.zone_code = 'R1' THEN 'High-Density Residential Sector'
            WHEN p.zone_code = 'R2' THEN 'Plotted Suburban Residential'
            WHEN p.zone_code = 'IND' THEN 'Industrial & Logistics Cluster'
            WHEN p.zone_code = 'AG' THEN 'Peri-Urban Agricultural Zone'
            ELSE 'Developing Growth Node'
        END AS tier
    FROM landstack.parcels p
    LEFT JOIN dept_utilities.connections u ON u.ulpin = p.ulpin
)
UPDATE dept_fiscal.valuation v
SET
    base_rate_per_sqm = f.base_rate,
    road_factor = ROUND(f.r_factor, 2),
    infra_factor = ROUND(f.i_factor, 2),
    zone_factor = ROUND(f.z_factor, 2),
    location_tier = f.tier,
    guideline_value_per_sqm = ROUND((f.base_rate * f.z_factor * f.r_factor * f.i_factor * f.m_factor) / 50.0) * 50.0,
    market_value_per_sqm = ROUND(
        ((ROUND((f.base_rate * f.z_factor * f.r_factor * f.i_factor * f.m_factor) / 50.0) * 50.0) *
        (1.30 + (CASE WHEN f.r_factor >= 1.25 THEN 0.12 ELSE 0.05 END) + (CASE WHEN f.i_factor >= 1.10 THEN 0.08 ELSE 0.02 END))
    ) / 50.0) * 50.0
FROM factors f
WHERE v.ulpin = f.ulpin;
