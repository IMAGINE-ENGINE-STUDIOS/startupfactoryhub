CREATE TABLE public.email_unsubscribes (
  email TEXT NOT NULL PRIMARY KEY,
  reason TEXT,
  source TEXT,
  user_id UUID,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_unsubscribes TO authenticated;
GRANT ALL ON public.email_unsubscribes TO service_role;

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view unsubscribes"
ON public.email_unsubscribes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_email_unsubscribes_updated_at
BEFORE UPDATE ON public.email_unsubscribes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();