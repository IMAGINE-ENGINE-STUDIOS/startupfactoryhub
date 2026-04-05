
-- Table for DJ recordings (mixes, mic sessions, announcements)
CREATE TABLE public.dj_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  duration_seconds INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  recording_type TEXT NOT NULL DEFAULT 'mix',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dj_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all recordings"
  ON public.dj_recordings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own recordings"
  ON public.dj_recordings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON public.dj_recordings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for DJ recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('dj-recordings', 'dj-recordings', true);

CREATE POLICY "Anyone can read dj recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dj-recordings');

CREATE POLICY "Authenticated users can upload dj recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dj-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own dj recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'dj-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
