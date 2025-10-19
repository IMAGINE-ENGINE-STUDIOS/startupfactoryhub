
-- Drop the problematic existing policies
DROP POLICY IF EXISTS "Startup owners can upload pitch deck" ON storage.objects;
DROP POLICY IF EXISTS "Startup owners can update pitch deck" ON storage.objects;
DROP POLICY IF EXISTS "Startup owners can delete pitch deck" ON storage.objects;

-- Create correct policies for pitch deck uploads
-- Policy: Allow startup owners to upload pitch decks to their company folder
CREATE POLICY "Startup owners can upload to their company folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-decks' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.companies
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow startup owners to update pitch decks in their company folder
CREATE POLICY "Startup owners can update their company pitch deck"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pitch-decks' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.companies
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow startup owners to delete pitch decks from their company folder
CREATE POLICY "Startup owners can delete their company pitch deck"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-decks' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.companies
    WHERE user_id = auth.uid()
  )
);
