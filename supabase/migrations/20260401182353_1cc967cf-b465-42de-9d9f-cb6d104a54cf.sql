
CREATE TABLE public.artemis_visitor_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.artemis_visitor_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor log" ON public.artemis_visitor_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read visitor count" ON public.artemis_visitor_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update own session" ON public.artemis_visitor_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_artemis_visitor_last_seen ON public.artemis_visitor_log (last_seen_at);
