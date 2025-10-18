-- Create shared PDF documents table for collaborative signing
CREATE TABLE IF NOT EXISTS public.shared_pdf_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.lightpaper_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  pdf_content JSONB NOT NULL,
  annotations JSONB DEFAULT '[]'::jsonb,
  signatures JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_pdf_documents ENABLE ROW LEVEL SECURITY;

-- Policies for shared documents
CREATE POLICY "Users can view their own shared documents"
  ON public.shared_pdf_documents
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create shared documents"
  ON public.shared_pdf_documents
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shared documents"
  ON public.shared_pdf_documents
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shared documents"
  ON public.shared_pdf_documents
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Public access policy for anyone with the share token
CREATE POLICY "Anyone can view active shared documents with token"
  ON public.shared_pdf_documents
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create table for tracking who signed the document
CREATE TABLE IF NOT EXISTS public.pdf_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.shared_pdf_documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signature_data TEXT NOT NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('draw', 'text')),
  position JSONB NOT NULL,
  page_number INTEGER NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone can add signatures to active documents
CREATE POLICY "Anyone can add signatures to active documents"
  ON public.pdf_signatures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_pdf_documents
      WHERE id = document_id 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Anyone can view signatures on documents they have access to
CREATE POLICY "Anyone can view signatures on accessible documents"
  ON public.pdf_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_pdf_documents
      WHERE id = document_id 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_shared_pdf_documents_updated_at
  BEFORE UPDATE ON public.shared_pdf_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_pdf_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pdf_signatures;

-- Add indexes for performance
CREATE INDEX idx_shared_pdf_documents_share_token ON public.shared_pdf_documents(share_token);
CREATE INDEX idx_shared_pdf_documents_owner_id ON public.shared_pdf_documents(owner_id);
CREATE INDEX idx_pdf_signatures_document_id ON public.pdf_signatures(document_id);