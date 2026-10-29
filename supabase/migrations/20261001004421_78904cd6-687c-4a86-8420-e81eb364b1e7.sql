CREATE TABLE public.socialite_shield_rules (id int PRIMARY KEY DEFAULT 1, config jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.socialite_shield_rules TO authenticated;
GRANT ALL ON public.socialite_shield_rules TO service_role;
ALTER TABLE public.socialite_shield_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shield rules read" ON public.socialite_shield_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "shield rules admin write" ON public.socialite_shield_rules FOR ALL TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
INSERT INTO public.socialite_shield_rules (id) VALUES (1);

CREATE TABLE public.socialite_shield_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, action text NOT NULL, level text NOT NULL, rule text NOT NULL, message text NOT NULL, details jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.socialite_shield_events (owner_id, created_at DESC);
GRANT SELECT ON public.socialite_shield_events TO authenticated;
GRANT ALL ON public.socialite_shield_events TO service_role;
ALTER TABLE public.socialite_shield_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shield events own or admin" ON public.socialite_shield_events FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_main_admin());

CREATE TABLE public.socialite_shield_flags (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, reason text NOT NULL, severity text NOT NULL DEFAULT 'medium', block_count int NOT NULL DEFAULT 1, status text NOT NULL DEFAULT 'open', decision text, decided_by uuid, decided_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.socialite_shield_flags (status, created_at DESC);
GRANT SELECT, UPDATE ON public.socialite_shield_flags TO authenticated;
GRANT ALL ON public.socialite_shield_flags TO service_role;
ALTER TABLE public.socialite_shield_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shield flags admin" ON public.socialite_shield_flags FOR ALL TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
CREATE TRIGGER socialite_shield_flags_touch BEFORE UPDATE ON public.socialite_shield_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.socialite_shield_status (owner_id uuid PRIMARY KEY, status text NOT NULL DEFAULT 'normal', note text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.socialite_shield_status TO authenticated;
GRANT ALL ON public.socialite_shield_status TO service_role;
ALTER TABLE public.socialite_shield_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shield status own or admin" ON public.socialite_shield_status FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_main_admin());
CREATE TRIGGER socialite_shield_status_touch BEFORE UPDATE ON public.socialite_shield_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();