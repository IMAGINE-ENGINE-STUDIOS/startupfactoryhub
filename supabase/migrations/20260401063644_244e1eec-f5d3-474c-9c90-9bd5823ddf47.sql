
CREATE TABLE public.artemis_watch_party_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.artemis_watch_party_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all messages"
  ON public.artemis_watch_party_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own messages"
  ON public.artemis_watch_party_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.artemis_watch_party_messages;
