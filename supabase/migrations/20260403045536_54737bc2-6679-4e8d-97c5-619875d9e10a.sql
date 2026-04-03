CREATE TABLE public.calendar_blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_date date NOT NULL,
  start_time time DEFAULT NULL,
  end_time time DEFAULT NULL,
  reason text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendar_blocked_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blocked times"
  ON public.calendar_blocked_times FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read blocked times"
  ON public.calendar_blocked_times FOR SELECT TO anon, authenticated
  USING (true);