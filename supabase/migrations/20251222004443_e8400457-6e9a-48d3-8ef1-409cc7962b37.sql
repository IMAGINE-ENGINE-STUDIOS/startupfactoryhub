-- Add enrollment fee and Stripe price ID to cohorts
ALTER TABLE public.accelerator_cohorts
ADD COLUMN IF NOT EXISTS enrollment_fee bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add payment status to cohort_startups
ALTER TABLE public.cohort_startups
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS payment_completed_at timestamp with time zone;

-- Add comment for payment_status values
COMMENT ON COLUMN public.cohort_startups.payment_status IS 'Values: not_required, pending_payment, paid, failed';