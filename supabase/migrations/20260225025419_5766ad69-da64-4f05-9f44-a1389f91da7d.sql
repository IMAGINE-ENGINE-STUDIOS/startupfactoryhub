
-- Add application/approval status to referral_accounts
ALTER TABLE public.referral_accounts 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS application_message text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'not_connected';

-- Create referral_links table for multiple links per partner
CREATE TABLE public.referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.referral_accounts(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'Default',
  total_clicks integer NOT NULL DEFAULT 0,
  total_conversions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral links
CREATE POLICY "Users can view own referral links"
  ON public.referral_links FOR SELECT
  USING (account_id IN (SELECT id FROM public.referral_accounts WHERE user_id = auth.uid()));

-- Users can insert their own referral links (only if approved)
CREATE POLICY "Users can create own referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.referral_accounts WHERE user_id = auth.uid() AND status = 'approved'));

-- Users can update their own referral links
CREATE POLICY "Users can update own referral links"
  ON public.referral_links FOR UPDATE
  USING (account_id IN (SELECT id FROM public.referral_accounts WHERE user_id = auth.uid()));

-- Users can delete their own referral links
CREATE POLICY "Users can delete own referral links"
  ON public.referral_links FOR DELETE
  USING (account_id IN (SELECT id FROM public.referral_accounts WHERE user_id = auth.uid()));

-- Admin can manage all referral links
CREATE POLICY "Admins can manage all referral links"
  ON public.referral_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update referral_clicks to reference referral_links too
ALTER TABLE public.referral_clicks
  ADD COLUMN IF NOT EXISTS link_id uuid REFERENCES public.referral_links(id) ON DELETE SET NULL;

-- Migrate existing referral_code from referral_accounts into referral_links
-- (existing accounts get their code as a default link)
INSERT INTO public.referral_links (account_id, referral_code, label)
SELECT id, referral_code, 'Default'
FROM public.referral_accounts
ON CONFLICT (referral_code) DO NOTHING;

-- Add admin policies for referral_accounts management
CREATE POLICY "Admins can view all referral accounts"
  ON public.referral_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all referral accounts"
  ON public.referral_accounts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
