
-- Create regus_locations table for global Regus office data
CREATE TABLE public.regus_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  office_type TEXT NOT NULL DEFAULT 'coworking',
  capacity INT,
  amenities TEXT[] DEFAULT '{}',
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regus_locations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active locations
CREATE POLICY "Authenticated users can read active regus locations"
  ON public.regus_locations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin can manage all locations
CREATE POLICY "Admins can manage regus locations"
  ON public.regus_locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin_notes column to hub_bookings
ALTER TABLE public.hub_bookings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for performance
CREATE INDEX idx_regus_locations_city ON public.regus_locations(city);
CREATE INDEX idx_regus_locations_country ON public.regus_locations(country);
CREATE INDEX idx_regus_locations_office_type ON public.regus_locations(office_type);
CREATE INDEX idx_regus_locations_active ON public.regus_locations(is_active);
