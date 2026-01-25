-- Update the Hot Deals in Space Industry event with a new placeholder that will trigger fresh room creation
-- The VideoConferencing component creates a fresh room on join, but we need a valid whereby.com URL pattern
UPDATE public.events
SET 
  location = 'https://startupfactoryhub.whereby.com/hot-deals-space-' || substr(gen_random_uuid()::text, 1, 8),
  updated_at = now()
WHERE id = '07975984-c47d-45f6-96c1-c2d6bd750db8';