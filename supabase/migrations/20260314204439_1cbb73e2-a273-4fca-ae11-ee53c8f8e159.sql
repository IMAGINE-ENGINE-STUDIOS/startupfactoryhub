
-- Saved/Favorite Locations
CREATE TABLE public.saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  place_type TEXT DEFAULT 'custom',
  icon TEXT DEFAULT 'star',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved locations"
  ON public.saved_locations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_saved_locations_user ON public.saved_locations(user_id);

-- Search History
CREATE TABLE public.map_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  result_type TEXT DEFAULT 'place',
  result_name TEXT,
  result_lat DOUBLE PRECISION,
  result_lng DOUBLE PRECISION,
  searched_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.map_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own search history"
  ON public.map_search_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_search_history_user ON public.map_search_history(user_id, searched_at DESC);

-- Route History
CREATE TABLE public.route_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  distance_meters DOUBLE PRECISION,
  duration_seconds DOUBLE PRECISION,
  route_geometry JSONB,
  avoid_tolls BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.route_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own route history"
  ON public.route_history FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_route_history_user ON public.route_history(user_id, created_at DESC);
