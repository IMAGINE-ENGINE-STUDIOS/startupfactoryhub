-- Update GitHub to be an official partner as per requirements
UPDATE public.resources 
SET is_official_partner = true
WHERE title = 'GitHub Free Venue Space';

-- Verify all official partner resources have proper coordinates
-- GitHub San Francisco coordinates
UPDATE public.resources
SET latitude = 37.7749, longitude = -122.4194
WHERE title = 'GitHub Free Venue Space' AND (latitude IS NULL OR longitude IS NULL);

-- Nasdaq Palo Alto coordinates  
UPDATE public.resources
SET latitude = 37.4419, longitude = -122.1430
WHERE title = 'Nasdaq Interns Match' AND (latitude IS NULL OR longitude IS NULL);