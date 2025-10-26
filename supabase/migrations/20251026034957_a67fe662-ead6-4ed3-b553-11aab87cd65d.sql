-- Create temporary uploads bucket for document parsing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to temp-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-uploads');

-- RLS Policy: Allow authenticated users to read their own uploads
CREATE POLICY "Allow authenticated reads from temp-uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'temp-uploads' AND auth.uid() = owner);

-- RLS Policy: Allow service role to delete (for cleanup)
CREATE POLICY "Allow service role to delete from temp-uploads"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'temp-uploads');