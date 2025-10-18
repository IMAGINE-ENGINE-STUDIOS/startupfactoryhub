-- Create pdf_editor_signatures table for user signature library
CREATE TABLE IF NOT EXISTS public.pdf_editor_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('draw', 'text')),
  signature_data TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pdf_editor_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own signatures"
  ON public.pdf_editor_signatures
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signatures"
  ON public.pdf_editor_signatures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures"
  ON public.pdf_editor_signatures
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures"
  ON public.pdf_editor_signatures
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_pdf_editor_signatures_user_id ON public.pdf_editor_signatures(user_id);

-- Create pdf-documents storage bucket for shared PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-documents', 'pdf-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for pdf-documents bucket
CREATE POLICY "Users can upload their own PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'pdf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PDFs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pdf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view PDFs with valid share token"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'pdf-documents' 
    AND EXISTS (
      SELECT 1 FROM public.shared_pdf_documents 
      WHERE storage.objects.name LIKE '%' || shared_pdf_documents.id::text || '%'
      AND shared_pdf_documents.is_active = true
      AND (shared_pdf_documents.expires_at IS NULL OR shared_pdf_documents.expires_at > NOW())
    )
  );

-- Update shared_pdf_documents table to add storage_path
ALTER TABLE public.shared_pdf_documents 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add access_level to shared_pdf_documents
ALTER TABLE public.shared_pdf_documents
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'sign', 'edit'));

-- Add password protection
ALTER TABLE public.shared_pdf_documents
ADD COLUMN IF NOT EXISTS password_hash TEXT;