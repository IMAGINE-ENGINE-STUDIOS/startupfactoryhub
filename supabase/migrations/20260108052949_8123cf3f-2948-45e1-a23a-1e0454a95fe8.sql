-- Create storage bucket for resource assets (logos and banners)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-assets', 'resource-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for resource assets bucket
-- Allow authenticated users to upload resource assets
CREATE POLICY "Authenticated users can upload resource assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resource-assets');

-- Allow anyone to view resource assets (public bucket)
CREATE POLICY "Anyone can view resource assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'resource-assets');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update resource assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resource-assets');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete resource assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resource-assets');