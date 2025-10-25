-- Add session_data column to store Fabric.js canvas states
ALTER TABLE pdf_editing_sessions 
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_pdf_editing_sessions_session_data 
ON pdf_editing_sessions USING gin(session_data);

-- Add comment
COMMENT ON COLUMN pdf_editing_sessions.session_data IS 'Stores serialized Fabric.js canvas states for each page (key: page number, value: Fabric JSON)';