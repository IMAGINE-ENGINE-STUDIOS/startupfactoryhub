ALTER TABLE public.socialite_credentials ADD COLUMN IF NOT EXISTS owner_id uuid;
UPDATE public.socialite_credentials SET owner_id = updated_by WHERE owner_id IS NULL;
ALTER TABLE public.socialite_credentials DROP CONSTRAINT socialite_credentials_pkey;
ALTER TABLE public.socialite_credentials ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.socialite_credentials ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS socialite_credentials_owner_platform ON public.socialite_credentials(owner_id, platform);

CREATE TABLE public.socialite_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  source text NOT NULL DEFAULT 'manual',
  last_sent_at timestamptz,
  last_channel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.socialite_contacts TO authenticated;
GRANT ALL ON public.socialite_contacts TO service_role;
ALTER TABLE public.socialite_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their contacts" ON public.socialite_contacts FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX socialite_contacts_owner ON public.socialite_contacts(owner_id, created_at DESC);
CREATE TRIGGER socialite_contacts_updated BEFORE UPDATE ON public.socialite_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();