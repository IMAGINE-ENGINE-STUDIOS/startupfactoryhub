-- Improve rate limiting to exclude avatar and status updates
-- This allows avatar uploads and online status updates without hitting rate limits

DROP TRIGGER IF EXISTS profile_rate_limit_trigger ON public.profiles;

-- Update the rate limiting function to be smarter about what counts
CREATE OR REPLACE FUNCTION public.check_profile_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only apply rate limiting to significant profile changes
  -- Exclude: avatar_url, last_seen, is_online, update_count, last_profile_update
  IF (
    OLD.full_name IS DISTINCT FROM NEW.full_name OR
    OLD.bio IS DISTINCT FROM NEW.bio OR
    OLD.location IS DISTINCT FROM NEW.location OR
    OLD.website IS DISTINCT FROM NEW.website OR
    OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url OR
    OLD.email IS DISTINCT FROM NEW.email
  ) THEN
    -- Reset counter if more than 1 hour has passed
    IF OLD.last_profile_update < now() - interval '1 hour' THEN
      NEW.update_count := 1;
      NEW.last_profile_update := now();
    -- If within rate limit window
    ELSIF OLD.update_count < 10 THEN
      NEW.update_count := OLD.update_count + 1;
      NEW.last_profile_update := now();
    -- Rate limit exceeded for significant changes
    ELSE
      RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Re-add the trigger
CREATE TRIGGER profile_rate_limit_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_rate_limit();