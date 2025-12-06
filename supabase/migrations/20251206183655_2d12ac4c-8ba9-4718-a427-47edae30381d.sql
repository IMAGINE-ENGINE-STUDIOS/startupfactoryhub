-- Add latitude, longitude, and is_virtual columns to events table for map integration
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS is_virtual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text;

-- Add comment for documentation
COMMENT ON COLUMN public.events.latitude IS 'Latitude coordinate for physical event location';
COMMENT ON COLUMN public.events.longitude IS 'Longitude coordinate for physical event location';
COMMENT ON COLUMN public.events.is_virtual IS 'Whether this is a virtual/online event';
COMMENT ON COLUMN public.events.city IS 'City of the event location';
COMMENT ON COLUMN public.events.country IS 'Country of the event location';