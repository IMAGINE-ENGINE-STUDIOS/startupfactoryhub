CREATE TABLE public.live_session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name text NOT NULL,
  kind text NOT NULL DEFAULT 'transcript',
  speaker text NOT NULL DEFAULT 'Guest',
  content text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.live_session_logs TO anon;
GRANT SELECT, INSERT, DELETE ON public.live_session_logs TO authenticated;
GRANT ALL ON public.live_session_logs TO service_role;
ALTER TABLE public.live_session_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add live logs" ON public.live_session_logs FOR INSERT TO anon, authenticated
  WITH CHECK (kind IN ('transcript','chat') AND length(content) BETWEEN 1 AND 5000);
CREATE POLICY "Admins read live logs" ON public.live_session_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete live logs" ON public.live_session_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX live_session_logs_room_idx ON public.live_session_logs (room_name, created_at);
-- make sure the CEO account is an admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'ceo@imagineengine.space'
ON CONFLICT DO NOTHING;