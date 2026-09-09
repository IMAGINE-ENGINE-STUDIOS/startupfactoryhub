-- 1. Restrict SECURITY DEFINER helper that signed-out visitors never need
REVOKE EXECUTE ON FUNCTION public.has_membership_access(uuid) FROM anon;

-- 2. Harden profile view tracking against spamming arbitrary users
CREATE OR REPLACE FUNCTION public.validate_profile_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.viewer_id IS NOT NULL AND NEW.viewer_id = NEW.viewed_profile_id THEN
    RAISE EXCEPTION 'Cannot record a view of your own profile';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles_data WHERE user_id = NEW.viewed_profile_id) THEN
    RAISE EXCEPTION 'Unknown profile';
  END IF;

  -- Throttle: ignore repeat views of the same profile by the same viewer within an hour
  IF NEW.viewer_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profile_views
    WHERE viewer_id = NEW.viewer_id
      AND viewed_profile_id = NEW.viewed_profile_id
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_profile_view() FROM anon, authenticated;

DROP TRIGGER IF EXISTS validate_profile_view_trigger ON public.profile_views;
CREATE TRIGGER validate_profile_view_trigger
BEFORE INSERT ON public.profile_views
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_view();

DROP POLICY IF EXISTS "Authenticated users can insert their own views" ON public.profile_views;
CREATE POLICY "Authenticated users can insert their own views"
ON public.profile_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id AND viewer_id <> viewed_profile_id);