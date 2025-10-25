-- Fix RLS policies to use correct folder index for user ID
-- The folder structure is: pdf-sessions/{user.id}/filename.pdf
-- So user ID is at index [2], not [1]

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can upload their own PDFs to pdf-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own PDFs from pdf-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs in pdf-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs from pdf-documents" ON storage.objects;

-- Recreate with correct folder index [2]
CREATE POLICY "Users can upload their own PDFs to pdf-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can read their own PDFs from pdf-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update their own PDFs in pdf-documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own PDFs from pdf-documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);