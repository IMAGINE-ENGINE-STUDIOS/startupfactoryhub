DROP POLICY IF EXISTS "Public buckets are viewable" ON storage.objects;
CREATE POLICY "Public buckets are viewable"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars','company-logos','feed-media','resource-assets','event-banners','ai-generated-images','ar-content','camera-snapshots','dj-recordings'));