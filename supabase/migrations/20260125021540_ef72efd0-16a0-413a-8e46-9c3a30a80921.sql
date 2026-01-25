-- Add Regus Office Spaces as an official partner perk
INSERT INTO public.resources (
  id,
  title,
  description,
  resource_type,
  location_type,
  website_url,
  logo_url,
  is_verified,
  is_official_partner,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Regus Office Spaces',
  'Official partner perk: Get 10% discount on flexible office spaces worldwide.',
  'perk',
  'hybrid',
  'https://www.regus.com?utm_source=startup-hub&utm_medium=marketing-partnerships&utm_campaign=usa&utm_id=partnerships+&utm_term=2026&utm_content=discount10',
  '/partners/regus-logo.png',
  true,
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.resources
  WHERE resource_type = 'perk'
    AND lower(title) = lower('Regus Office Spaces')
);