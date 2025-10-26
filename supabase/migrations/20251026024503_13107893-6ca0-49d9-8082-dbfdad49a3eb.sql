-- Fix storage policies for pdf-documents bucket
-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view PDFs with valid share token" ON storage.objects;

-- Create comprehensive policies for pdf-documents bucket
CREATE POLICY "pdf_documents_insert_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pdf_documents_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pdf_documents_select_shared"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pdf-documents' 
    AND EXISTS (
      SELECT 1 FROM public.shared_pdf_documents 
      WHERE storage.objects.name LIKE '%' || shared_pdf_documents.id::text || '%'
      AND shared_pdf_documents.is_active = true
      AND (shared_pdf_documents.expires_at IS NULL OR shared_pdf_documents.expires_at > NOW())
    )
  );

CREATE POLICY "pdf_documents_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pdf_documents_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pdf-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );