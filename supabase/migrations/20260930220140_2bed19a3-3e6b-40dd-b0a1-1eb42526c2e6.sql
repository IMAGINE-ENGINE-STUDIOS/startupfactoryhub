CREATE TABLE public.socialite_state (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.socialite_state TO authenticated;
GRANT ALL ON public.socialite_state TO service_role;
ALTER TABLE public.socialite_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Main admin manages socialite state" ON public.socialite_state FOR ALL TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());