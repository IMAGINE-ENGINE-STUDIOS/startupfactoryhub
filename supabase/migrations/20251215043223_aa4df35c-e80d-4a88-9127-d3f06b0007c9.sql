-- Add is_flagship column to resources table
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS is_flagship BOOLEAN DEFAULT FALSE;

-- Update flagship locations for Startup Factory Hub
UPDATE public.resources 
SET is_flagship = TRUE 
WHERE title ILIKE '%Startup Factory Hub%' 
  AND resource_type = 'accelerator_incubator';