
-- ========================================
-- REFERRAL PROGRAM + UNIFIED PAYOUT SYSTEM
-- ========================================

-- 1. Referral Accounts
CREATE TABLE public.referral_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL UNIQUE,
  total_clicks integer NOT NULL DEFAULT 0,
  total_referrals integer NOT NULL DEFAULT 0,
  total_earned_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral account"
  ON public.referral_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral account"
  ON public.referral_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral account"
  ON public.referral_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Referral Clicks
CREATE TABLE public.referral_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code text NOT NULL REFERENCES public.referral_accounts(referral_code) ON DELETE CASCADE,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Public insert for anonymous click tracking
CREATE POLICY "Anyone can insert referral clicks"
  ON public.referral_clicks FOR INSERT
  WITH CHECK (true);

-- Only referral owner can view their clicks
CREATE POLICY "Referral owners can view their clicks"
  ON public.referral_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.referral_accounts ra
      WHERE ra.referral_code = referral_clicks.referral_code
        AND ra.user_id = auth.uid()
    )
  );

-- 3. Referral Conversions
CREATE TABLE public.referral_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES public.referral_accounts(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  subscription_tier text,
  subscription_amount_cents bigint NOT NULL DEFAULT 0,
  commission_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their conversions"
  ON public.referral_conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.referral_accounts ra
      WHERE ra.id = referral_conversions.referrer_id
        AND ra.user_id = auth.uid()
    )
  );

-- 4. Payout Accounts (unified for events, districts, referrals)
CREATE TABLE public.payout_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  stripe_connect_account_id text,
  account_status text NOT NULL DEFAULT 'pending',
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payout account"
  ON public.payout_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payout account"
  ON public.payout_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payout account"
  ON public.payout_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Payout Requests
CREATE TABLE public.payout_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  source text NOT NULL DEFAULT 'referrals',
  status text NOT NULL DEFAULT 'pending',
  stripe_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payout requests"
  ON public.payout_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_referral_accounts_updated_at
  BEFORE UPDATE ON public.referral_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_accounts_updated_at
  BEFORE UPDATE ON public.payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
