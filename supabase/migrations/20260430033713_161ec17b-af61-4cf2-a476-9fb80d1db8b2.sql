
CREATE TABLE public.legacy_imported_startups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  differentiators TEXT,
  location TEXT,
  country TEXT,
  markets TEXT[],
  founded_text TEXT,
  website TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  milestone TEXT,
  revenue_model TEXT,
  cash_runway TEXT,
  total_funding TEXT,
  rev_last_12_months TEXT,
  rev_last_month TEXT,
  interfaces TEXT,
  clients TEXT,
  videos TEXT,
  decks TEXT,
  assigned_evaluators TEXT,
  founders JSONB NOT NULL DEFAULT '[]'::jsonb,
  import_status TEXT NOT NULL DEFAULT 'pending',
  import_error TEXT,
  linked_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  imported_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_imported_startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view legacy startups"
ON public.legacy_imported_startups FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert legacy startups"
ON public.legacy_imported_startups FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update legacy startups"
ON public.legacy_imported_startups FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete legacy startups"
ON public.legacy_imported_startups FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legacy_imported_startups_updated_at
BEFORE UPDATE ON public.legacy_imported_startups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_legacy_startups_status ON public.legacy_imported_startups(import_status);
