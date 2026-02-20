
-- Add village_type enum
DO $$ BEGIN
  CREATE TYPE public.village_type AS ENUM ('democratic_republic', 'merchant_village');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add village_type column to live_rooms (nullable for backward compat with existing village rooms)
ALTER TABLE public.live_rooms
  ADD COLUMN IF NOT EXISTS village_type public.village_type DEFAULT NULL;

-- Add api_cost_multiplier column for merchant villages (2x) vs democratic (1x)
ALTER TABLE public.live_rooms
  ADD COLUMN IF NOT EXISTS api_cost_multiplier numeric DEFAULT 1.0;

-- Create village_purchases table to track the $200 payment + API costs
CREATE TABLE IF NOT EXISTS public.village_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stripe_session_id text,
  stripe_payment_intent text,
  base_fee_cents integer NOT NULL DEFAULT 20000, -- $200
  api_cost_multiplier numeric NOT NULL DEFAULT 1.0,
  total_paid_cents integer,
  payment_status text NOT NULL DEFAULT 'pending',
  village_type public.village_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.village_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own village purchases"
  ON public.village_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (handled via edge function)
CREATE POLICY "Service role manages village purchases"
  ON public.village_purchases FOR ALL
  USING (auth.role() = 'service_role');

-- Admins (has_role) can view all
CREATE POLICY "Admins can view all village purchases"
  ON public.village_purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update existing village rooms to have democratic_republic as default type
UPDATE public.live_rooms
  SET village_type = 'democratic_republic'
  WHERE room_category = 'village' AND village_type IS NULL;
