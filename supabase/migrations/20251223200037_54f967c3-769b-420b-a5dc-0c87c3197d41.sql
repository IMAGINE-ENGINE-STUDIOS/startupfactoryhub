-- Update resources to have specific journey_steps instead of 'all'
-- Based on resource type, assign appropriate stages

-- Perks (like hosting, domains, etc.) - available from MVP onwards when building
UPDATE public.resources 
SET journey_steps = ARRAY['mvp', 'validation', 'launch', 'growth']::text[]
WHERE resource_type = 'perk' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Human capital (jobs, interns) - needed from MVP stage when building team
UPDATE public.resources 
SET journey_steps = ARRAY['mvp', 'validation', 'launch', 'growth']::text[]
WHERE resource_type = 'human_capital' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Community resources - helpful in early stages for networking
UPDATE public.resources 
SET journey_steps = ARRAY['idea', 'research', 'validation']::text[]
WHERE resource_type = 'community' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Labs - for research and MVP development
UPDATE public.resources 
SET journey_steps = ARRAY['research', 'mvp']::text[]
WHERE resource_type = 'lab' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Accelerators/Incubators - validation through growth
UPDATE public.resources 
SET journey_steps = ARRAY['validation', 'launch', 'growth']::text[]
WHERE resource_type = 'accelerator_incubator' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Government grants - research through launch
UPDATE public.resources 
SET journey_steps = ARRAY['research', 'mvp', 'validation', 'launch']::text[]
WHERE resource_type = 'government_grant' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Coworking spaces - MVP through growth
UPDATE public.resources 
SET journey_steps = ARRAY['mvp', 'validation', 'launch', 'growth']::text[]
WHERE resource_type = 'coworking' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Universities - idea and research stages
UPDATE public.resources 
SET journey_steps = ARRAY['idea', 'research']::text[]
WHERE resource_type = 'university' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);

-- Investor networks - validation through growth
UPDATE public.resources 
SET journey_steps = ARRAY['validation', 'launch', 'growth']::text[]
WHERE resource_type = 'investor_network' AND (journey_steps = ARRAY['all']::text[] OR journey_steps @> ARRAY['all']::text[]);