-- Drop the incorrect INSERT policy
DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;

-- Create corrected INSERT policy that checks the second folder level
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = 'pdf-sessions'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Users can read their own PDFs" ON storage.objects;

-- Create corrected SELECT policy
CREATE POLICY "Users can read their own PDFs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pdf-documents' 
    AND (
      -- User's own files in pdf-sessions folder
      ((storage.foldername(name))[1] = 'pdf-sessions' AND auth.uid()::text = (storage.foldername(name))[2])
      OR
      -- Shared documents (existing policy)
      EXISTS (
        SELECT 1 FROM public.shared_pdf_documents 
        WHERE storage.objects.name LIKE '%' || shared_pdf_documents.id::text || '%'
        AND shared_pdf_documents.is_active = true
        AND (shared_pdf_documents.expires_at IS NULL OR shared_pdf_documents.expires_at > NOW())
      )
    )
  );

-- Add UPDATE policy for users to update their own PDFs
CREATE POLICY "Users can update their own PDFs"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = 'pdf-sessions'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Add DELETE policy for users to delete their own PDFs
CREATE POLICY "Users can delete their own PDFs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = 'pdf-sessions'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );