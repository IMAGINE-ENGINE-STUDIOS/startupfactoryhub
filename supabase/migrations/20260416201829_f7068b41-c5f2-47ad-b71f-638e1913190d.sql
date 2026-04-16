-- Anonymous event feedback table
CREATE TABLE public.hot_deals_event_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  category text NOT NULL DEFAULT 'overall' CHECK (category IN ('overall','pitches','production','community')),
  session_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_token, category)
);

CREATE INDEX idx_hot_deals_event_feedback_category ON public.hot_deals_event_feedback(category);
CREATE INDEX idx_hot_deals_event_feedback_created_at ON public.hot_deals_event_feedback(created_at DESC);

ALTER TABLE public.hot_deals_event_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous or authenticated) can submit
CREATE POLICY "Anyone can submit event feedback"
ON public.hot_deals_event_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (
  rating >= 1 AND rating <= 5
  AND length(session_token) BETWEEN 8 AND 128
  AND (comment IS NULL OR length(comment) <= 1000)
);

-- Anyone can read aggregate / comments (anonymous data only)
CREATE POLICY "Anyone can view event feedback"
ON public.hot_deals_event_feedback
FOR SELECT
TO anon, authenticated
USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hot_deals_event_feedback;
ALTER TABLE public.hot_deals_event_feedback REPLICA IDENTITY FULL;