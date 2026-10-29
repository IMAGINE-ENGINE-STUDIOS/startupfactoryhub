ALTER TABLE public.socialite_state ADD COLUMN owner_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.socialite_state DROP CONSTRAINT socialite_state_pkey;
ALTER TABLE public.socialite_state ADD PRIMARY KEY (owner_id, key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.socialite_state TO authenticated;
CREATE POLICY "Users manage own socialite state" ON public.socialite_state FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());