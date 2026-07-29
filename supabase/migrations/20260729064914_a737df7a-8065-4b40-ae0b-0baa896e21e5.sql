CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users,
  label TEXT NOT NULL,
  email_type TEXT NOT NULL,
  function_name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'batch',
  recipient_field TEXT NOT NULL DEFAULT 'to',
  recipients TEXT[] NOT NULL DEFAULT '{}',
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_emails TO authenticated;
GRANT ALL ON public.scheduled_emails TO service_role;

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scheduled emails"
ON public.scheduled_emails FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_scheduled_emails_due ON public.scheduled_emails (status, scheduled_at);

CREATE TRIGGER update_scheduled_emails_updated_at
BEFORE UPDATE ON public.scheduled_emails
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();