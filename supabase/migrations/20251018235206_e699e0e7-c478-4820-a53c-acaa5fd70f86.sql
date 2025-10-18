-- Create table for document comments
CREATE TABLE IF NOT EXISTS public.document_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.lightpaper_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  position JSONB, -- {x, y} coordinates for inline comments
  thread_id UUID, -- For comment threads/replies
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for live cursor positions
CREATE TABLE IF NOT EXISTS public.document_cursors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.lightpaper_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_color TEXT NOT NULL, -- Unique color for each user's cursor
  position JSONB NOT NULL, -- {x, y, selection} cursor data
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on document_comments
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on document_cursors
ALTER TABLE public.document_cursors ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_comments
CREATE POLICY "Anyone can view comments on shared projects"
  ON public.document_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.document_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments"
  ON public.document_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.document_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for document_cursors
CREATE POLICY "Anyone can view cursors on shared projects"
  ON public.document_cursors
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own cursor"
  ON public.document_cursors
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_document_comments_project_id ON public.document_comments(project_id);
CREATE INDEX idx_document_comments_thread_id ON public.document_comments(thread_id);
CREATE INDEX idx_document_cursors_project_id ON public.document_cursors(project_id);
CREATE INDEX idx_document_cursors_last_active ON public.document_cursors(last_active);

-- Function to clean up old cursor positions (older than 5 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_old_cursors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.document_cursors
  WHERE last_active < now() - interval '5 minutes';
END;
$$;

-- Add realtime publication for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_cursors;