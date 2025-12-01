-- Insert GitHub Free Venue Space resource as official Startup Factory Hub partner
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
  website_url,
  contact_email,
  logo_url,
  is_verified,
  author_id
) 
SELECT 
  'GitHub Free Venue Space',
  'Official partner of Startup Factory Hub accelerator - Free venue space for startups in the heart of San Francisco''s SoMa district',
  'venue',
  'physical',
  '88 Colin P Kelly Jr St',
  'San Francisco',
  'United States',
  37.7823,
  -122.3912,
  'https://github.com',
  'partner@startupfactoryhub.com',
  '/src/assets/github-logo.png',
  true,
  id
FROM auth.users 
LIMIT 1
ON CONFLICT DO NOTHING;