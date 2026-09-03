CREATE TABLE public.home_layout (
  id text PRIMARY KEY DEFAULT 'home',
  section_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  hidden_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_layout TO anon;
GRANT SELECT, INSERT, UPDATE ON public.home_layout TO authenticated;
GRANT ALL ON public.home_layout TO service_role;
ALTER TABLE public.home_layout ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view home layout" ON public.home_layout FOR SELECT USING (true);
CREATE POLICY "Admins can insert home layout" ON public.home_layout FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update home layout" ON public.home_layout FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.home_layout (id) VALUES ('home') ON CONFLICT DO NOTHING;