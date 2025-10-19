-- Add favorites/bookmarks functionality
CREATE TABLE IF NOT EXISTS public.project_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.lightpaper_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS on project_favorites
ALTER TABLE public.project_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_favorites
CREATE POLICY "Users can manage their own favorites"
  ON public.project_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add full-text search column to lightpaper_projects
ALTER TABLE public.lightpaper_projects 
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_lightpaper_projects_search 
  ON public.lightpaper_projects 
  USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION public.update_project_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Extract text content from JSONB content field
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(
      CASE 
        WHEN NEW.content IS NOT NULL THEN 
          COALESCE(NEW.content->>'html', '') || ' ' ||
          COALESCE(NEW.content->>'text', '') || ' ' ||
          NEW.content::text
        ELSE ''
      END
    , '')), 'B');
  RETURN NEW;
END;
$$;

-- Trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_search_vector_trigger ON public.lightpaper_projects;
CREATE TRIGGER update_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.lightpaper_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_search_vector();

-- Update existing records
UPDATE public.lightpaper_projects SET updated_at = updated_at;

-- Create function for searching projects
CREATE OR REPLACE FUNCTION public.search_lightpaper_projects(
  search_query TEXT,
  user_id_param UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  project_type TEXT,
  content JSONB,
  rank REAL,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id,
    lp.title,
    lp.project_type::TEXT,
    lp.content,
    ts_rank(lp.search_vector, websearch_to_tsquery('english', search_query)) AS rank,
    lp.updated_at,
    lp.last_accessed_at
  FROM public.lightpaper_projects lp
  WHERE 
    lp.user_id = user_id_param
    AND lp.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC, lp.updated_at DESC
  LIMIT 50;
END;
$$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lightpaper_projects_user_updated 
  ON public.lightpaper_projects(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_lightpaper_projects_user_accessed 
  ON public.lightpaper_projects(user_id, last_accessed_at DESC);