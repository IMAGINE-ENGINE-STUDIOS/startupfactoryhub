
-- Camera catalog: persistent store of all known cameras worldwide
CREATE TABLE public.camera_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  image_url TEXT NOT NULL,
  source TEXT NOT NULL,
  stream_url TEXT,
  refresh_rate INTEGER DEFAULT 10,
  region TEXT,
  country TEXT DEFAULT 'US',
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  feed_status TEXT DEFAULT 'unknown'
);

-- Spatial index for fast viewport queries
CREATE INDEX idx_camera_catalog_location ON public.camera_catalog (lat, lng);
CREATE INDEX idx_camera_catalog_source ON public.camera_catalog (source);
CREATE INDEX idx_camera_catalog_country ON public.camera_catalog (country);

-- Camera sync status tracking
CREATE TABLE public.camera_sync_status (
  source_name TEXT PRIMARY KEY,
  last_sync_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  camera_count INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: camera_catalog is public read (cameras are public data)
ALTER TABLE public.camera_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cameras" ON public.camera_catalog FOR SELECT USING (true);

ALTER TABLE public.camera_sync_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sync status" ON public.camera_sync_status FOR SELECT USING (true);
