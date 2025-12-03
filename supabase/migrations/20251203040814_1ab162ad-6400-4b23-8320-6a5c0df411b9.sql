INSERT INTO public.resources (
  title,
  resource_type,
  location_type,
  description,
  address,
  city,
  country,
  latitude,
  longitude,
  website_url,
  is_verified,
  tags,
  category
) VALUES (
  'One Million Cups',
  'community',
  'physical',
  'One Million Cups is a free, weekly event designed to educate, engage and connect entrepreneurs. Hosted at TechHub Orlando/OMG Labs, it brings together the local startup community for networking and presentations.',
  '36 W. Pine St., Downtown Orlando',
  'Orlando',
  'United States',
  28.5421,
  -81.3790,
  'https://www.1millioncups.com/orlando',
  true,
  ARRAY['networking', 'entrepreneurs', 'community events', 'weekly meetup'],
  'community'
);