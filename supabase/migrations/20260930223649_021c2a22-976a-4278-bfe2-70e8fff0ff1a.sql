CREATE TABLE public.socialite_scheduled (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  send_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/New_York',
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.socialite_scheduled TO authenticated;
GRANT ALL ON public.socialite_scheduled TO service_role;
ALTER TABLE public.socialite_scheduled ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Main admin manages scheduled sends" ON public.socialite_scheduled
  FOR ALL TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
CREATE INDEX socialite_scheduled_due ON public.socialite_scheduled (status, send_at);
CREATE TRIGGER socialite_scheduled_touch BEFORE UPDATE ON public.socialite_scheduled
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();