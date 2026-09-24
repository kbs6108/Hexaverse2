-- 014_parcel_privacy_preferences.sql — Landowner configurable privacy preferences for public visibility.
-- Gives title owners control over optional public disclosures while strictly enforcing mandatory statutory records.

CREATE TABLE IF NOT EXISTS landstack.parcel_privacy (
    ulpin                 text PRIMARY KEY REFERENCES landstack.parcels (ulpin) ON DELETE CASCADE,
    owner_uid             text,
    public_owner_name     boolean NOT NULL DEFAULT false, -- false = privacy masked (R*** K***), true = full name visible
    public_nominees       boolean NOT NULL DEFAULT false, -- false = hidden from public, true = visible (masked)
    public_deed_details   boolean NOT NULL DEFAULT false, -- false = masked (****0001), true = unmasked
    public_building_units boolean NOT NULL DEFAULT true,  -- true = visible footprint, false = hidden
    public_utilities      boolean NOT NULL DEFAULT true,  -- true = visible, false = hidden
    updated_at            timestamptz NOT NULL DEFAULT now()
);
