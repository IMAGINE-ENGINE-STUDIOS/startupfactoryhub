
-- Add ticket pricing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS ticket_price_cents bigint NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

-- Create event_payments table
CREATE TABLE public.event_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stripe_session_id text,
  amount_cents bigint NOT NULL DEFAULT 0,
  platform_fee_cents bigint NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.event_payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can view their own event payments"
ON public.event_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Service role inserts (edge functions use service role key)
CREATE POLICY "Service role can manage event payments"
ON public.event_payments
FOR ALL
USING (true)
WITH CHECK (true);
