
ALTER TABLE public.crm_cards
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Storage RLS for business-cards bucket (bucket itself is created via storage_create_bucket tool)
CREATE POLICY "Users can view their own business cards"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own business cards"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own business cards"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own business cards"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-cards'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
