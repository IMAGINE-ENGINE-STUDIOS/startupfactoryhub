
CREATE TABLE public.intern_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  program TEXT,
  company TEXT,
  invite_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','activated','expired')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intern_invitations_token ON public.intern_invitations(invite_token);
CREATE INDEX idx_intern_invitations_status ON public.intern_invitations(status);

GRANT SELECT ON public.intern_invitations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intern_invitations TO authenticated;
GRANT ALL ON public.intern_invitations TO service_role;

ALTER TABLE public.intern_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all invitations"
ON public.intern_invitations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read invitation by token"
ON public.intern_invitations FOR SELECT
TO anon, authenticated
USING (true);

CREATE TRIGGER update_intern_invitations_updated_at
BEFORE UPDATE ON public.intern_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
