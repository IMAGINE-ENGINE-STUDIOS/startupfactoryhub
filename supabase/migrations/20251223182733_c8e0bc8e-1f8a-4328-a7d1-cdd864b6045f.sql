-- Update existing resources with journey_steps based on their resource_type
UPDATE public.resources
SET journey_steps = CASE resource_type
  WHEN 'accelerator_incubator' THEN ARRAY['mvp', 'validation', 'launch', 'growth']::text[]
  WHEN 'coworking' THEN ARRAY['all']::text[]
  WHEN 'lab' THEN ARRAY['research', 'mvp']::text[]
  WHEN 'venue' THEN ARRAY['launch', 'growth']::text[]
  WHEN 'perk' THEN ARRAY['all']::text[]
  WHEN 'government_grant' THEN ARRAY['idea', 'research', 'mvp']::text[]
  WHEN 'investor_network' THEN ARRAY['growth']::text[]
  WHEN 'university' THEN ARRAY['idea', 'research']::text[]
  WHEN 'technology_transfer' THEN ARRAY['research', 'mvp']::text[]
  WHEN 'entrepreneur_center' THEN ARRAY['idea', 'research', 'mvp']::text[]
  WHEN 'community' THEN ARRAY['all']::text[]
  WHEN 'human_capital' THEN ARRAY['all']::text[]
  WHEN 'office' THEN ARRAY['mvp', 'validation', 'launch', 'growth']::text[]
  WHEN 'event' THEN ARRAY['all']::text[]
  WHEN 'chamber_of_commerce' THEN ARRAY['launch', 'growth']::text[]
  ELSE ARRAY['all']::text[]
END
WHERE journey_steps IS NULL OR journey_steps = '{}'::text[];