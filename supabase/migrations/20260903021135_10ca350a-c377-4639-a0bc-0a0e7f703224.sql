CREATE TABLE IF NOT EXISTS public.membership_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  note text,
  granted_by uuid,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_grants_active_user_idx
  ON public.membership_grants (user_id)
  WHERE revoked_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_grants TO authenticated;
GRANT ALL ON public.membership_grants TO service_role;

ALTER TABLE public.membership_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own membership grant" ON public.membership_grants;
CREATE POLICY "Users can view their own membership grant"
  ON public.membership_grants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create membership grants" ON public.membership_grants;
CREATE POLICY "Admins can create membership grants"
  ON public.membership_grants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update membership grants" ON public.membership_grants;
CREATE POLICY "Admins can update membership grants"
  ON public.membership_grants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete membership grants" ON public.membership_grants;
CREATE POLICY "Admins can delete membership grants"
  ON public.membership_grants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.has_membership_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.membership_grants g
      WHERE g.user_id = _user_id
        AND g.revoked_at IS NULL
        AND (g.expires_at IS NULL OR g.expires_at > now())
    );
$$;

REVOKE ALL ON FUNCTION public.has_membership_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_membership_access(uuid) TO authenticated, service_role;