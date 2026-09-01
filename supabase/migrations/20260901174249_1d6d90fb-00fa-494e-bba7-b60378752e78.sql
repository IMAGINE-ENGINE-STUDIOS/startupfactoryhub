ALTER TABLE public.public_cohort_applications
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE INDEX IF NOT EXISTS idx_public_cohort_applications_referral_code
  ON public.public_cohort_applications (referral_code)
  WHERE referral_code IS NOT NULL;

ALTER TABLE public.referral_conversions
  ADD COLUMN IF NOT EXISTS program_type TEXT NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_referral_conversions_program_type
  ON public.referral_conversions (program_type);