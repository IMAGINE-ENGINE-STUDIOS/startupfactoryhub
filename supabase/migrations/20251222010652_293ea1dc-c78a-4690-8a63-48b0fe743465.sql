-- Add payment configuration columns to accelerator_cohorts
ALTER TABLE public.accelerator_cohorts
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'one_time',
ADD COLUMN IF NOT EXISTS payment_duration_months integer,
ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Add subscription tracking columns to cohort_startups
ALTER TABLE public.cohort_startups
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_end_date date;

-- Add constraint for payment_type values
ALTER TABLE public.accelerator_cohorts
ADD CONSTRAINT valid_payment_type CHECK (payment_type IN ('one_time', 'monthly'));