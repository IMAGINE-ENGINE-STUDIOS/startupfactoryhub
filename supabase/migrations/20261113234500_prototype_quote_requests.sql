-- Prototype Studio Job 5: manufacture quote requests, routed into SFH.
-- The package snapshot (BOM + wiring + behaviours) travels with the
-- request so SFH and its manufacturing partners quote the exact design.
CREATE TABLE public.prototype_quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  project_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  target_date TEXT,
  notes TEXT,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  package JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prototype_quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own quote requests"
  ON public.prototype_quote_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_proto_quote_user ON public.prototype_quote_requests (user_id);
CREATE INDEX idx_proto_quote_project ON public.prototype_quote_requests (project_id);
