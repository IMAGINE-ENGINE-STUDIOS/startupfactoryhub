-- Phase 3.2: Add database indexes for performance optimization

-- Index for searching projects by user and type
CREATE INDEX IF NOT EXISTS idx_lightpaper_projects_user_type 
ON lightpaper_projects(user_id, project_type, updated_at DESC);

-- Index for full-text search (already exists but ensure it's optimized)
CREATE INDEX IF NOT EXISTS idx_lightpaper_projects_search 
ON lightpaper_projects USING gin(to_tsvector('english', title || ' ' || COALESCE((content->>'text')::text, '')));

-- Index for comments by project and creation time
CREATE INDEX IF NOT EXISTS idx_document_comments_project_created 
ON document_comments(project_id, created_at DESC);

-- Index for cursors by project and activity
CREATE INDEX IF NOT EXISTS idx_document_cursors_project_active 
ON document_cursors(project_id, last_active DESC);

-- Index for favorites query optimization
CREATE INDEX IF NOT EXISTS idx_project_favorites_user 
ON project_favorites(user_id, created_at DESC);

-- Index for favorites join query
CREATE INDEX IF NOT EXISTS idx_project_favorites_project 
ON project_favorites(project_id, user_id);

-- Index for document collaborators
CREATE INDEX IF NOT EXISTS idx_document_collaborators_doc 
ON document_collaborators(document_id, last_seen DESC);

-- Index for shared PDF documents
CREATE INDEX IF NOT EXISTS idx_shared_pdf_token 
ON shared_pdf_documents(share_token) WHERE is_active = true;

-- Index for PDF signatures
CREATE INDEX IF NOT EXISTS idx_pdf_signatures_document 
ON pdf_signatures(document_id, signed_at DESC);

-- Cleanup old inactive cursors (older than 1 hour)
DELETE FROM document_cursors WHERE last_active < NOW() - INTERVAL '1 hour';

-- Cleanup old collaborators (older than 10 minutes)
DELETE FROM document_collaborators WHERE last_seen < NOW() - INTERVAL '10 minutes';