-- 007_ror_state.sql — tag RoR rows with their state (CONTRACTS §7). Idempotent.
-- The revenue mock serves each state's vocabulary (AP Meebhoomi khata/owner, TN Patta Chitta
-- patta/pattadar/hectares, TG Dharani passbook/acres); the row's state selects the dialect.

ALTER TABLE dept_revenue.ror ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'AP';
