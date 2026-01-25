-- Add TradingView as an official partner perk for the Resources tab carousel
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
  'TradingView',
  'Official partner perk: Track markets & analyze charts.',
  'perk',
  'online',
  'https://www.tradingview.com/?aff_id=162505',
  '/partners/tradingview-logo.png',
  true,
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.resources
  WHERE resource_type = 'perk'
    AND lower(title) = lower('TradingView')
);
