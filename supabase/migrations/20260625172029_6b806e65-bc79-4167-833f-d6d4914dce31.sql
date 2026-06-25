CREATE TABLE IF NOT EXISTS public.venezuela_rebuild_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_user_id UUID,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  net_amount_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.venezuela_rebuild_donations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.venezuela_rebuild_donations TO authenticated;
GRANT ALL ON public.venezuela_rebuild_donations TO service_role;

ALTER TABLE public.venezuela_rebuild_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view completed donations"
  ON public.venezuela_rebuild_donations FOR SELECT
  USING (status = 'completed');

CREATE POLICY "Company owner views own donations"
  ON public.venezuela_rebuild_donations FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()));

CREATE POLICY "Service role manages donations"
  ON public.venezuela_rebuild_donations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_vzla_donations_company ON public.venezuela_rebuild_donations(company_id);
CREATE INDEX IF NOT EXISTS idx_vzla_donations_status ON public.venezuela_rebuild_donations(status);

CREATE TRIGGER update_vzla_donations_updated_at
  BEFORE UPDATE ON public.venezuela_rebuild_donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();