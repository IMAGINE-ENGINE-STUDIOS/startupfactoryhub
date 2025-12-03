INSERT INTO public.resources (
  title,
  resource_type,
  location_type,
  description,
  website_url,
  logo_url,
  is_official_partner,
  is_verified,
  tags,
  category
) VALUES (
  'GitHub Marketing Team',
  'perk',
  'online',
  'We''re actively seeking GitHub success stories to bring to our various program engagements. Encourage select companies to apply. Nominate your startup for a wide range of highlight and customer marketing opportunities with us.',
  'https://github.com',
  'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
  true,
  true,
  ARRAY['marketing', 'customer stories', 'startup highlights', 'promotion'],
  'marketing'
);