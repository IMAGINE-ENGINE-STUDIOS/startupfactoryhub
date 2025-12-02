-- Add Startup Factory Hub Tokyo location
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
  is_verified,
  is_official_partner
) VALUES (
  'Startup Factory Hub - Tokyo',
  'Our flagship Tokyo location in the heart of Marunouchi, providing world-class resources and support for startups in the Japanese market.',
  'accelerator_incubator',
  'physical',
  '1 Chome-8-2 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
  'Tokyo',
  'Japan',
  35.681236,
  139.767125,
  'stevenl@startupfactoryhub.com',
  '/startup-factory-hub-logo.jpg',
  true,
  true
);