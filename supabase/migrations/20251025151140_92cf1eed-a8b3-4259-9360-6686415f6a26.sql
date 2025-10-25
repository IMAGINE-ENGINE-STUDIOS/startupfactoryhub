-- Fix PDF editor storage permissions
-- Add comprehensive RLS policies for pdf-documents bucket

-- Allow users to upload their own PDFs to their folder
CREATE POLICY "Users can upload their own PDFs to pdf-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own PDFs
CREATE POLICY "Users can read their own PDFs from pdf-documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own PDFs
CREATE POLICY "Users can update their own PDFs in pdf-documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own PDFs
CREATE POLICY "Users can delete their own PDFs from pdf-documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pdf-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);