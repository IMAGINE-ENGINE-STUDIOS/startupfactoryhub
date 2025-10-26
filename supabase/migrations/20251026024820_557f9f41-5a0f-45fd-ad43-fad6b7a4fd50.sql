-- Drop old conflicting storage policies for pdf-documents bucket
-- These policies incorrectly check foldername[2] instead of foldername[1]
DROP POLICY IF EXISTS "Users can upload their own PDFs to pdf-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own PDFs from pdf-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs in pdf-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs from pdf-documents" ON storage.objects;

-- The correct policies (pdf_documents_*) are already in place from the previous migration