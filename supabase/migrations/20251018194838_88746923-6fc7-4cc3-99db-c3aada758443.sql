-- Ensure feed-media storage bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-media',
  'feed-media',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Anyone can view feed media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload feed media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own feed media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own feed media" ON storage.objects;

-- Create RLS policies for feed-media bucket
CREATE POLICY "Anyone can view feed media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feed-media');

CREATE POLICY "Authenticated users can upload feed media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feed-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own feed media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'feed-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own feed media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feed-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure users can delete their own posts
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.feed_posts;
CREATE POLICY "Users can delete their own posts"
ON public.feed_posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);