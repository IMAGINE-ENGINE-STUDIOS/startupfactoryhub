CREATE TABLE public.live_guest_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  guest_role text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.live_guest_checkins TO anon, authenticated;
GRANT SELECT, DELETE ON public.live_guest_checkins TO authenticated;
GRANT ALL ON public.live_guest_checkins TO service_role;
ALTER TABLE public.live_guest_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check in" ON public.live_guest_checkins FOR INSERT TO anon, authenticated
  WITH CHECK (
    guest_role IN ('startup','investor')
    AND length(full_name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 255 AND email LIKE '%@%'
    AND length(room_name) BETWEEN 1 AND 200
    AND (user_id IS NULL OR user_id = auth.uid())
  );
CREATE POLICY "Admins read check-ins" ON public.live_guest_checkins FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete check-ins" ON public.live_guest_checkins FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));