-- Create document_versions table for temporary version storage
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.lightpaper_projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  content JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  is_temporary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_document_versions_user_session ON public.document_versions(user_id, session_id, created_at);
CREATE INDEX idx_document_versions_project ON public.document_versions(project_id);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Users can view their own versions
CREATE POLICY "Users can view their own versions"
  ON public.document_versions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own versions
CREATE POLICY "Users can create their own versions"
  ON public.document_versions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own versions
CREATE POLICY "Users can delete their own versions"
  ON public.document_versions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up old temporary versions (keep last 100 per session)
CREATE OR REPLACE FUNCTION public.cleanup_old_document_versions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old temporary versions, keeping only the last 100 for this session
  DELETE FROM public.document_versions
  WHERE user_id = NEW.user_id
    AND session_id = NEW.session_id
    AND is_temporary = true
    AND id NOT IN (
      SELECT id FROM public.document_versions
      WHERE user_id = NEW.user_id
        AND session_id = NEW.session_id
        AND is_temporary = true
      ORDER BY created_at DESC
      LIMIT 100
    );
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically cleanup old versions
CREATE TRIGGER trigger_cleanup_old_versions
  AFTER INSERT ON public.document_versions
  FOR EACH ROW
  WHEN (NEW.is_temporary = true)
  EXECUTE FUNCTION public.cleanup_old_document_versions();