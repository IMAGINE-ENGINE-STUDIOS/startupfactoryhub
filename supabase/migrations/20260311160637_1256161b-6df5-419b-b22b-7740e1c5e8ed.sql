-- Create camera_snapshots table to track stored snapshots
CREATE TABLE IF NOT EXISTS public.camera_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  storage_path text NOT NULL,
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient time-range queries
CREATE INDEX idx_camera_snapshots_camera_time ON public.camera_snapshots (camera_id, captured_at DESC);

-- Auto-cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_camera_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.camera_snapshots
  WHERE captured_at < now() - interval '24 hours';
END;
$$;

-- RLS
ALTER TABLE public.camera_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert camera snapshots"
  ON public.camera_snapshots FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read camera snapshots"
  ON public.camera_snapshots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete old camera snapshots"
  ON public.camera_snapshots FOR DELETE
  TO anon, authenticated
  USING (captured_at < now() - interval '24 hours');

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('camera-snapshots', 'camera-snapshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can upload camera snapshots"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'camera-snapshots');

CREATE POLICY "Anyone can read camera snapshots storage"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'camera-snapshots');

CREATE POLICY "Anyone can delete old camera snapshots storage"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'camera-snapshots');