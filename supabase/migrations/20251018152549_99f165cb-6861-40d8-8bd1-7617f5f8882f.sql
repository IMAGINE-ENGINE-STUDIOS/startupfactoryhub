-- Create enum for project types
CREATE TYPE lightpaper_project_type AS ENUM ('document', 'spreadsheet', 'presentation', 'pdf', 'sign');

-- Create table for storing LightPaper projects
CREATE TABLE public.lightpaper_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_type lightpaper_project_type NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lightpaper_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own projects"
  ON public.lightpaper_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.lightpaper_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.lightpaper_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.lightpaper_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_lightpaper_projects_user_id ON public.lightpaper_projects(user_id);
CREATE INDEX idx_lightpaper_projects_type ON public.lightpaper_projects(user_id, project_type);
CREATE INDEX idx_lightpaper_projects_updated ON public.lightpaper_projects(user_id, updated_at DESC);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_lightpaper_projects_updated_at
  BEFORE UPDATE ON public.lightpaper_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();