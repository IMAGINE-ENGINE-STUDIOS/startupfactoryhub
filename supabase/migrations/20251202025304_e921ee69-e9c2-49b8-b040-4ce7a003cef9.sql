-- Add Pro Bono Lawyers resource in Human Capital category
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
  is_verified,
  is_official_partner
) VALUES (
  'Pro Bono Lawyers',
  'The Florida Bar provides pro bono legal services. Hours: 8:00 a.m.-5:30 p.m., Monday-Friday. Phone: 850-561-5600',
  'human_capital',
  'physical',
  '651 E. Jefferson St., Tallahassee, FL 32399-2300',
  'Tallahassee',
  'United States',
  30.4383,
  -84.2807,
  'https://www.floridabar.org/public/probono/',
  NULL,
  true,
  false
);