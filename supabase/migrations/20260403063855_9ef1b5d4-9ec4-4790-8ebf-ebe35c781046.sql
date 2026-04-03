
CREATE TABLE public.hot_deals_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hot_deals_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages"
ON public.hot_deals_chat FOR SELECT
USING (true);

CREATE POLICY "Anyone can send chat messages"
ON public.hot_deals_chat FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_hot_deals_chat_created ON public.hot_deals_chat (created_at DESC);
