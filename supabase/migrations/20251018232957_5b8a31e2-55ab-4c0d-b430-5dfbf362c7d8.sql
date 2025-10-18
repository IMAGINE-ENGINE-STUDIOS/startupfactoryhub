-- Create document collaborators table for real-time presence tracking
CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.shared_pdf_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'viewing', -- viewing, editing, signing
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

-- Anyone can view collaborators on active documents
CREATE POLICY "Anyone can view collaborators on active documents"
ON public.document_collaborators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_pdf_documents
    WHERE id = document_collaborators.document_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  )
);

-- Anyone can insert their presence
CREATE POLICY "Anyone can join as collaborator"
ON public.document_collaborators
FOR INSERT
WITH CHECK (true);

-- Users can update their own presence
CREATE POLICY "Users can update their own presence"
ON public.document_collaborators
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can remove their own presence
CREATE POLICY "Users can remove their own presence"
ON public.document_collaborators
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_document_collaborators_document 
ON public.document_collaborators(document_id);

CREATE INDEX IF NOT EXISTS idx_document_collaborators_user 
ON public.document_collaborators(user_id);

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_collaborators;