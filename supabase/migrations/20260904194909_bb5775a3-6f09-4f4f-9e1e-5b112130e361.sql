ALTER TABLE public.public_cohort_applications
ADD COLUMN IF NOT EXISTS is_incorporated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_working_mvp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_revenue boolean DEFAULT false;

COMMENT ON COLUMN public.public_cohort_applications.is_incorporated IS 'Company is legally incorporated';
COMMENT ON COLUMN public.public_cohort_applications.has_working_mvp IS 'Startup has a working prototype or MVP';
COMMENT ON COLUMN public.public_cohort_applications.has_revenue IS 'Startup is currently generating revenue';
