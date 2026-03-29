ALTER TABLE recording_sessions 
  ADD COLUMN IF NOT EXISTS refresh_rate integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS duration_mode text DEFAULT 'indefinite',
  ADD COLUMN IF NOT EXISTS scheduled_stop_at timestamptz,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS last_capture_at timestamptz;

DROP FUNCTION IF EXISTS public.cleanup_old_camera_snapshots();