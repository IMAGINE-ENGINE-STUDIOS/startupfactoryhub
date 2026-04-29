INSERT INTO public.accelerator_cohorts (
  accelerator_id,
  name,
  description,
  status,
  focus_industries,
  enrollment_fee,
  payment_type,
  max_startups
) VALUES (
  '969d49dc-6b34-4d18-a6eb-7871416fff38',
  'Ignition',
  'Ignition is the Startup Factory Hub flagship 1-week in-person U.S. expansion program for Seed-stage founders. Includes: 1 Week in Orlando, Presentation Day at Kennedy Space Center, Mentorship, Advisory, Access to Technologies, U.S. Company Registration, Webinars, Industry Day, Networking events with the Orlando Tech ecosystem, and Social Media exposure across our platform channels.',
  'applications_open',
  ARRAY['Aerospace','Deep Tech','Photonics','AI/ML']::text[],
  0,
  'one_time',
  10
);