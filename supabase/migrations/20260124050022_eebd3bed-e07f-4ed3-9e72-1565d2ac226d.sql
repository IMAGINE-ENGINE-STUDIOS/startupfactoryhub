-- Create hub_bookings table for workspace reservations
CREATE TABLE public.hub_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'internal',
  provider_booking_id TEXT,
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  workspace_type TEXT NOT NULL,
  from_datetime TIMESTAMPTZ NOT NULL,
  to_datetime TIMESTAMPTZ NOT NULL,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hub_venues_cache table for caching workspace data
CREATE TABLE public.hub_venues_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_venue_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  workspace_types TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  hourly_rate_min NUMERIC(10,2),
  hourly_rate_max NUMERIC(10,2),
  daily_rate_min NUMERIC(10,2),
  daily_rate_max NUMERIC(10,2),
  rating NUMERIC(3,2),
  image_url TEXT,
  is_hotel BOOLEAN NOT NULL DEFAULT false,
  is_professional BOOLEAN NOT NULL DEFAULT true,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on hub_bookings
ALTER TABLE public.hub_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.hub_bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.hub_bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON public.hub_bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Enable RLS on hub_venues_cache (public read)
ALTER TABLE public.hub_venues_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read venue cache
CREATE POLICY "Anyone can read venue cache"
ON public.hub_venues_cache
FOR SELECT
USING (true);

-- Create indexes for performance
CREATE INDEX idx_hub_bookings_user_id ON public.hub_bookings(user_id);
CREATE INDEX idx_hub_bookings_status ON public.hub_bookings(status);
CREATE INDEX idx_hub_venues_cache_city ON public.hub_venues_cache(city);
CREATE INDEX idx_hub_venues_cache_coords ON public.hub_venues_cache(latitude, longitude);
CREATE INDEX idx_hub_venues_cache_professional ON public.hub_venues_cache(is_professional) WHERE is_professional = true AND is_hotel = false;

-- Trigger for updated_at on hub_bookings
CREATE TRIGGER update_hub_bookings_updated_at
BEFORE UPDATE ON public.hub_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();