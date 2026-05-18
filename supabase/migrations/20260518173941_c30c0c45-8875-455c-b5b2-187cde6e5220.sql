CREATE TABLE public.directory_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  manager TEXT,
  vintage_year INTEGER,
  fund_size BIGINT,
  average_investment BIGINT,
  investment_strategy TEXT,
  fund_style TEXT,
  accepting_investments BOOLEAN,
  ir_name TEXT,
  ir_email TEXT,
  ir_phone TEXT,
  source TEXT NOT NULL DEFAULT 'SBIC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_directory_investors_state ON public.directory_investors(state);
CREATE INDEX idx_directory_investors_accepting ON public.directory_investors(accepting_investments);
CREATE INDEX idx_directory_investors_source ON public.directory_investors(source);

ALTER TABLE public.directory_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view directory investors"
ON public.directory_investors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert directory investors"
ON public.directory_investors FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update directory investors"
ON public.directory_investors FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete directory investors"
ON public.directory_investors FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_directory_investors_updated_at
BEFORE UPDATE ON public.directory_investors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();