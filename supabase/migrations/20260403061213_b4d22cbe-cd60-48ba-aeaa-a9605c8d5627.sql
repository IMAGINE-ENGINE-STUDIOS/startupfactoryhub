
CREATE TABLE public.hot_deals_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_slot TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hot_deals_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agenda" ON public.hot_deals_agenda FOR SELECT USING (true);
CREATE POLICY "Public insert agenda" ON public.hot_deals_agenda FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update agenda" ON public.hot_deals_agenda FOR UPDATE USING (true);
CREATE POLICY "Public delete agenda" ON public.hot_deals_agenda FOR DELETE USING (true);

INSERT INTO public.hot_deals_agenda (time_slot, title, description, sort_order) VALUES
  ('2:00 PM', 'Welcome & Introduction', 'Opening remarks and event overview', 1),
  ('2:10 PM', 'Startup #1 Pitch', 'First startup presents their pitch', 2),
  ('2:20 PM', 'Startup #2 Pitch', 'Second startup presents their pitch', 3),
  ('2:30 PM', 'Startup #3 Pitch', 'Third startup presents their pitch', 4),
  ('2:40 PM', 'Startup #4 Pitch', 'Fourth startup presents their pitch', 5),
  ('2:50 PM', 'Startup #5 Pitch', 'Fifth startup presents their pitch', 6),
  ('3:00 PM', 'Live Voting', 'Audience votes for their favorite startup', 7),
  ('3:15 PM', 'Winner Announcement', 'Announcing the Hot Deals winner', 8);
