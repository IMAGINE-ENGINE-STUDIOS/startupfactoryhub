-- Global Credit standard (founder directive, 2026-11-03): one single credit
-- price for the whole platform. 1 Credit = $0.06, and 1 Credit buys any one
-- AI action. Monthly plan grants = plan price / $0.06, floored to the
-- nearest ten. This table is the canonical registry of the standard; the
-- live grant path (check-genius-plan's product map + ai_credits_grant)
-- carries the same quantities per Stripe product.
CREATE TABLE IF NOT EXISTS public.plan_credit_standard (
  plan text PRIMARY KEY,
  price_usd numeric NOT NULL,
  credit_usd numeric NOT NULL DEFAULT 0.06,
  monthly_credits integer NOT NULL
);

INSERT INTO public.plan_credit_standard (plan, price_usd, monthly_credits) VALUES
  ('members_club', 50, 830),
  ('community', 350, 5830),
  ('venture_resident', 550, 9160),
  ('venture_advisor', 550, 9160),
  ('global_venture_partner', 950, 15830),
  ('corporate', 1500, 25000),
  ('institutional', 5000, 83330)
ON CONFLICT (plan) DO UPDATE
  SET price_usd = EXCLUDED.price_usd,
      credit_usd = EXCLUDED.credit_usd,
      monthly_credits = EXCLUDED.monthly_credits;

GRANT SELECT ON public.plan_credit_standard TO authenticated, service_role;
ALTER TABLE public.plan_credit_standard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read the credit standard" ON public.plan_credit_standard
  FOR SELECT TO authenticated USING (true);
