-- Create a dedicated media bucket for feed posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-media',
  'feed-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  file_size_limit = 52428800;

-- RLS policies for feed-media bucket
CREATE POLICY "Anyone can view feed media"
ON storage.objects FOR SELECT
USING (bucket_id = 'feed-media');

CREATE POLICY "Authenticated users can upload feed media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feed-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own feed media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'feed-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own feed media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feed-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);