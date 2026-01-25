-- Add Flippa as an official partner perk
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
  'Flippa',
  'Official partner perk: Buy and sell online businesses, websites, and digital assets.',
  'perk',
  'online',
  'https://flippa.com/?pscd=referral.flippa.com&ps_partner_key=MTUzZGRlNzQ4MTBi&ps_xid=nEqmA59myMjRQP&gsxid=nEqmA59myMjRQP&gspk=MTUzZGRlNzQ4MTBi',
  '/partners/flippa-logo.png',
  true,
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.resources
  WHERE resource_type = 'perk'
    AND lower(title) = lower('Flippa')
);