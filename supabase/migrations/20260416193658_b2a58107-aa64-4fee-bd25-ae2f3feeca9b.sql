-- Extend winner codes with bonus perk metadata
ALTER TABLE public.hot_deals_winner_codes
  ADD COLUMN IF NOT EXISTS includes_earth_intelligence BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS bonus_access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_bundle_value_cents INTEGER NOT NULL DEFAULT 594000;

-- Track granted Earth Intelligence bonus access per user
CREATE TABLE IF NOT EXISTS public.hot_deals_winner_bonus_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_code_id UUID REFERENCES public.hot_deals_winner_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  perk_type TEXT NOT NULL DEFAULT 'earth_intelligence',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year'),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, perk_type)
);

CREATE INDEX IF NOT EXISTS idx_hot_deals_winner_bonus_access_user_id
  ON public.hot_deals_winner_bonus_access(user_id);

ALTER TABLE public.hot_deals_winner_bonus_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bonus access"
ON public.hot_deals_winner_bonus_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own bonus access"
ON public.hot_deals_winner_bonus_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Helper function: check if a user has active Earth Intelligence bonus access
CREATE OR REPLACE FUNCTION public.has_earth_intelligence_bonus(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hot_deals_winner_bonus_access
    WHERE user_id = _user_id
      AND perk_type = 'earth_intelligence'
      AND active = true
      AND expires_at > now()
  );
$$;