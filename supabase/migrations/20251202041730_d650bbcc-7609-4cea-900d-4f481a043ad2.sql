-- Add Startup Factory Hub Orlando/Lake Nona office
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
  is_official_partner,
  is_verified,
  logo_url,
  website_url,
  category
) VALUES (
  'Startup Factory Hub - Orlando',
  'Flagship accelerator and innovation hub in Lake Nona, Orlando providing comprehensive support for startups including mentorship, resources, and networking opportunities.',
  'accelerator_incubator',
  'physical',
  '6900 Tavistock Lakes Boulevard Southeast, Suite 400, Lake Nona Center',
  'Orlando, FL 32827',
  'United States',
  28.3684,
  -81.2596,
  'infomiami@startupfactoryhub.com',
  true,
  true,
  '/startup-factory-hub-logo.png',
  'https://startupfactoryhub.com',
  'Accelerator'
);