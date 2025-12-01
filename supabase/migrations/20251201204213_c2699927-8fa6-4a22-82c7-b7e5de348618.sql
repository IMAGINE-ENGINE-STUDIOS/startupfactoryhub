-- Extend resources table for global resource mapping
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS resource_type TEXT NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS location_type TEXT NOT NULL DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_resources_location ON public.resources(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for resource type filtering
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);

-- Add check constraint for resource_type
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS check_resource_type;
ALTER TABLE public.resources ADD CONSTRAINT check_resource_type 
CHECK (resource_type IN (
  'office', 'lab', 'venue', 'perk', 'chamber_of_commerce', 
  'technology_transfer', 'community', 'government_grant', 
  'accelerator_incubator', 'entrepreneur_center', 'university', 
  'coworking', 'investor_network', 'other'
));

-- Add check constraint for location_type
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS check_location_type;
ALTER TABLE public.resources ADD CONSTRAINT check_location_type 
CHECK (location_type IN ('physical', 'online', 'hybrid'));

-- Update RLS policies for resources to allow viewing verified resources
DROP POLICY IF EXISTS "Anyone can view verified resources" ON public.resources;
CREATE POLICY "Anyone can view verified resources"
  ON public.resources FOR SELECT
  USING (is_verified = true);

-- Allow authenticated users to submit resources (pending verification)
DROP POLICY IF EXISTS "Authenticated users can submit resources" ON public.resources;
CREATE POLICY "Authenticated users can submit resources"
  ON public.resources FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own unverified submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.resources;
CREATE POLICY "Users can view their own submissions"
  ON public.resources FOR SELECT
  USING (auth.uid() = author_id);

-- Users can update their own unverified resources
DROP POLICY IF EXISTS "Users can update their own unverified resources" ON public.resources;
CREATE POLICY "Users can update their own unverified resources"
  ON public.resources FOR UPDATE
  USING (auth.uid() = author_id AND is_verified = false);