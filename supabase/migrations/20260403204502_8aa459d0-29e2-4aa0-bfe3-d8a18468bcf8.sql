-- Delete demo votes and donations first (FK constraints)
DELETE FROM public.hot_deals_donations WHERE startup_id IN (
  SELECT id FROM public.hot_deals_invited_startups
);
DELETE FROM public.hot_deals_votes WHERE startup_id IN (
  SELECT id FROM public.hot_deals_invited_startups
);
DELETE FROM public.hot_deals_invited_startups;

-- Add columns for invitation workflow
ALTER TABLE public.hot_deals_invited_startups
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS invitation_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;