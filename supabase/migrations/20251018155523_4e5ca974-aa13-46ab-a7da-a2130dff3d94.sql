-- Add thumbnail support to lightpaper_projects
ALTER TABLE lightpaper_projects 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create share links table
CREATE TABLE IF NOT EXISTS lightpaper_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES lightpaper_projects(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'edit', 'comment')),
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on share links
ALTER TABLE lightpaper_share_links ENABLE ROW LEVEL SECURITY;

-- Users can create share links for their own projects
CREATE POLICY "Users can create share links for their projects"
ON lightpaper_share_links FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM lightpaper_projects WHERE user_id = auth.uid()
  )
);

-- Users can view share links for their own projects
CREATE POLICY "Users can view share links for their projects"
ON lightpaper_share_links FOR SELECT
USING (
  project_id IN (
    SELECT id FROM lightpaper_projects WHERE user_id = auth.uid()
  )
);

-- Users can update share links for their own projects
CREATE POLICY "Users can update share links for their projects"
ON lightpaper_share_links FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM lightpaper_projects WHERE user_id = auth.uid()
  )
);

-- Users can delete share links for their own projects
CREATE POLICY "Users can delete share links for their projects"
ON lightpaper_share_links FOR DELETE
USING (
  project_id IN (
    SELECT id FROM lightpaper_projects WHERE user_id = auth.uid()
  )
);

-- Anyone can view share links by token (for public sharing)
CREATE POLICY "Anyone can view share links by token"
ON lightpaper_share_links FOR SELECT
USING (true);

-- Create activity log table
CREATE TABLE IF NOT EXISTS lightpaper_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES lightpaper_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on activity log
ALTER TABLE lightpaper_activity ENABLE ROW LEVEL SECURITY;

-- Users can view activity for their own projects
CREATE POLICY "Users can view activity for their projects"
ON lightpaper_activity FOR SELECT
USING (
  project_id IN (
    SELECT id FROM lightpaper_projects WHERE user_id = auth.uid()
  )
);

-- System can create activity logs
CREATE POLICY "System can create activity logs"
ON lightpaper_activity FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_share_links_token ON lightpaper_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_project ON lightpaper_share_links(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON lightpaper_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON lightpaper_activity(user_id);