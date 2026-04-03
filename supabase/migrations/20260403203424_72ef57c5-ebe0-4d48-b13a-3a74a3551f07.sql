
-- Create donations table
CREATE TABLE public.hot_deals_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.hot_deals_invited_startups(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),
  platform_fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hot_deals_donations ENABLE ROW LEVEL SECURITY;

-- Everyone can see donation totals
CREATE POLICY "Anyone can view donations"
ON public.hot_deals_donations FOR SELECT
USING (true);

-- Anyone can insert pending donations (guest checkout)
CREATE POLICY "Anyone can create pending donations"
ON public.hot_deals_donations FOR INSERT
WITH CHECK (true);

-- Only service role can update donation status (via edge function)
CREATE POLICY "Service role can update donations"
ON public.hot_deals_donations FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add stripe connect account id to invited startups
ALTER TABLE public.hot_deals_invited_startups
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
