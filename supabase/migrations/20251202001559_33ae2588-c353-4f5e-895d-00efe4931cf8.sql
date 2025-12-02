-- Add CareerSource Florida Human Capital Grant resource
INSERT INTO public.resources (
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
  is_official_partner
) VALUES (
  'Human Capital Grant by CareerSource FL',
  'Up to $25,000 grants to hire and train new professionals. CareerSource Florida helps businesses grow their workforce through customized training programs.',
  'government_grant',
  'physical',
  '2308 Killearn Center Blvd, Ste 101',
  'Tallahassee',
  'United States',
  30.5127,
  -84.2632,
  'https://careersourceflorida.com/business-services/training-grants/qrt/',
  'info@careersourceflorida.com',
  '/careersource-fl-logo.jpg',
  true,
  false
);