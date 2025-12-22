-- Add journey_steps column to resources table for categorizing resources by startup journey stage
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS journey_steps text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.resources.journey_steps IS 'Array of journey steps this resource is relevant for: idea, research, mvp, validation, launch, growth, all';