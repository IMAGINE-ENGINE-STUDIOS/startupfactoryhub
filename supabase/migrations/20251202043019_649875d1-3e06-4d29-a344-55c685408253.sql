-- Add banner_url column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add Startup Factory Hub New York location
INSERT INTO resources (
  title,
  description,
  resource_type,
  location_type,
  address,
  city,
  country,
  latitude,
  longitude,
  contact_email,
  logo_url,
  banner_url,
  is_verified,
  is_official_partner
) VALUES (
  'Startup Factory Hub - New York',
  'Our flagship New York location on Wall Street, providing world-class resources and support for startups in the heart of the financial district.',
  'accelerator_incubator',
  'physical',
  '14 Wall Street, 20th Floor, Manhattan, New York, NY 10005',
  'New York',
  'United States',
  40.7074,
  -73.9863,
  'info@startupfactoryhub.com',
  '/startup-factory-hub-logo.jpg',
  '/startup-factory-hub-banner.avif',
  true,
  true
);

-- Update all existing Startup Factory Hub locations to use the new banner
UPDATE resources
SET banner_url = '/startup-factory-hub-banner.avif'
WHERE title LIKE 'Startup Factory Hub%';