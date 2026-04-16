
CREATE TABLE public.hot_deals_winner_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID REFERENCES public.hot_deals_winner(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL,
  promo_code TEXT NOT NULL UNIQUE,
  stripe_coupon_id TEXT,
  stripe_promotion_code_id TEXT,
  tier TEXT NOT NULL DEFAULT 'community',
  yearly_value_cents INTEGER NOT NULL DEFAULT 378000,
  redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID,
  recipient_email TEXT,
  recipient_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hot_deals_winner_codes_promo_code ON public.hot_deals_winner_codes(promo_code);
CREATE INDEX idx_hot_deals_winner_codes_startup_id ON public.hot_deals_winner_codes(startup_id);

ALTER TABLE public.hot_deals_winner_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage winner codes"
ON public.hot_deals_winner_codes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their redeemed code"
ON public.hot_deals_winner_codes
FOR SELECT
TO authenticated
USING (redeemed_by_user_id = auth.uid());

CREATE TRIGGER update_hot_deals_winner_codes_updated_at
BEFORE UPDATE ON public.hot_deals_winner_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
