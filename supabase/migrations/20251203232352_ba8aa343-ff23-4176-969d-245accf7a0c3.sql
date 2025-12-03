-- Add columns to cohort_startups for manual/external entries and alumni support
ALTER TABLE cohort_startups ADD COLUMN IF NOT EXISTS is_manual_entry boolean DEFAULT false;
ALTER TABLE cohort_startups ADD COLUMN IF NOT EXISTS external_company_name text;
ALTER TABLE cohort_startups ADD COLUMN IF NOT EXISTS external_company_industry text;
ALTER TABLE cohort_startups ADD COLUMN IF NOT EXISTS external_company_website text;
ALTER TABLE cohort_startups ADD COLUMN IF NOT EXISTS external_company_logo text;
ALTER TABLE cohort_startups ADD COLUMN IF NOT EXISTS graduation_year integer;

-- Update RLS policies to allow accelerators to insert manual entries
CREATE POLICY "Accelerators can insert manual portfolio entries"
ON cohort_startups FOR INSERT
WITH CHECK (
  cohort_id IN (
    SELECT c.id FROM accelerator_cohorts c
    JOIN accelerator_profiles ap ON c.accelerator_id = ap.id
    WHERE ap.user_id = auth.uid()
  )
);