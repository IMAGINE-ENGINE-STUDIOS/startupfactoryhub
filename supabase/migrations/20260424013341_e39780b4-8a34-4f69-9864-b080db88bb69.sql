-- AR Drops table
CREATE TABLE public.ar_drops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('model_3d', 'image', 'audio', 'video', 'text')),
  content_url TEXT,
  thumbnail_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION DEFAULT 0,
  rotation DOUBLE PRECISION DEFAULT 0,
  scale DOUBLE PRECISION DEFAULT 1,
  color TEXT DEFAULT '#00ffaa',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ar_drops_location ON public.ar_drops (latitude, longitude);
CREATE INDEX idx_ar_drops_user ON public.ar_drops (user_id);
CREATE INDEX idx_ar_drops_created ON public.ar_drops (created_at DESC);

ALTER TABLE public.ar_drops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public AR drops"
ON public.ar_drops FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create AR drops"
ON public.ar_drops FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AR drops"
ON public.ar_drops FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AR drops"
ON public.ar_drops FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_ar_drops_updated_at
BEFORE UPDATE ON public.ar_drops
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments / chat per drop
CREATE TABLE public.ar_drop_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drop_id UUID NOT NULL REFERENCES public.ar_drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ar_drop_comments_drop ON public.ar_drop_comments (drop_id, created_at);

ALTER TABLE public.ar_drop_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view AR drop comments on public drops"
ON public.ar_drop_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ar_drops d
    WHERE d.id = ar_drop_comments.drop_id
      AND (d.is_public = true OR d.user_id = auth.uid())
  )
);

CREATE POLICY "Authenticated users can post comments"
ON public.ar_drop_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.ar_drop_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.ar_drops REPLICA IDENTITY FULL;
ALTER TABLE public.ar_drop_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ar_drops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ar_drop_comments;

-- Storage bucket for AR content
INSERT INTO storage.buckets (id, name, public)
VALUES ('ar-content', 'ar-content', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "AR content is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ar-content');

CREATE POLICY "Authenticated users can upload AR content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ar-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own AR content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ar-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own AR content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ar-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);