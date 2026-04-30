-- Staging table for legacy mentor/advisor imports from previous platform
CREATE TABLE IF NOT EXISTS public.legacy_imported_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_account_id TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  company_name TEXT,
  email TEXT NOT NULL,
  legacy_role TEXT,
  mapped_role public.app_role NOT NULL DEFAULT 'mentor',
  legacy_signup_date TIMESTAMPTZ,
  legacy_verified BOOLEAN DEFAULT false,
  legacy_approved BOOLEAN DEFAULT false,
  import_status TEXT NOT NULL DEFAULT 'pending', -- pending | invited | skipped_duplicate | failed
  import_error TEXT,
  invited_at TIMESTAMPTZ,
  linked_user_id UUID,
  source_file TEXT DEFAULT 'previous_platform_export',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS legacy_imported_users_email_unique
  ON public.legacy_imported_users (lower(email));

CREATE INDEX IF NOT EXISTS legacy_imported_users_status_idx
  ON public.legacy_imported_users (import_status);

ALTER TABLE public.legacy_imported_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage legacy imports
CREATE POLICY "Admins can view legacy imports"
  ON public.legacy_imported_users
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert legacy imports"
  ON public.legacy_imported_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update legacy imports"
  ON public.legacy_imported_users
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete legacy imports"
  ON public.legacy_imported_users
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legacy_imported_users_updated_at
  BEFORE UPDATE ON public.legacy_imported_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();