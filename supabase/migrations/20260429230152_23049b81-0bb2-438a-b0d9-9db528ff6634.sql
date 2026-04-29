CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_company TEXT,
  client_address TEXT,
  title TEXT NOT NULL DEFAULT 'Formal Proposal',
  notes TEXT,
  terms TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view proposals"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert proposals"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update proposals"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete proposals"
  ON public.proposals FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_proposals_created_at ON public.proposals(created_at DESC);
CREATE INDEX idx_proposals_status ON public.proposals(status);