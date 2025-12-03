-- Create public cohort applications table for external applicants
CREATE TABLE public_cohort_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES accelerator_cohorts(id) ON DELETE CASCADE,
  startup_name text NOT NULL,
  founder_name text NOT NULL,
  email text NOT NULL,
  phone text,
  industry text,
  stage text,
  website text,
  pitch_deck_url text,
  video_pitch_url text,
  why_applying text,
  status text DEFAULT 'pending',
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public_cohort_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public applications)
CREATE POLICY "Anyone can submit public cohort applications"
  ON public_cohort_applications FOR INSERT
  WITH CHECK (true);

-- Only accelerator owners can view
CREATE POLICY "Accelerators can view their cohort applications"
  ON public_cohort_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM accelerator_cohorts c
      JOIN accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE c.id = public_cohort_applications.cohort_id
      AND ap.user_id = auth.uid()
    )
  );

-- Accelerators can update their cohort applications
CREATE POLICY "Accelerators can update their cohort applications"
  ON public_cohort_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM accelerator_cohorts c
      JOIN accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE c.id = public_cohort_applications.cohort_id
      AND ap.user_id = auth.uid()
    )
  );