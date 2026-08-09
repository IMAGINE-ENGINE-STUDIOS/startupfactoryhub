
-- 1. corporate_partners: hide contact email/phone from the public
DROP POLICY IF EXISTS "Anyone can view featured partners" ON public.corporate_partners;
REVOKE SELECT ON public.corporate_partners FROM anon;

CREATE OR REPLACE VIEW public.corporate_partners_public
WITH (security_invoker = off) AS
SELECT id, company_name, company_website, company_size, partnership_type,
       partnership_interests, logo_url, is_featured, created_at
FROM public.corporate_partners
WHERE is_featured = true AND status = 'approved';
GRANT SELECT ON public.corporate_partners_public TO anon, authenticated;

-- 2. hot_deals_votes: remove public full-row read, expose tallies via view only
DROP POLICY IF EXISTS "Public can view vote tallies" ON public.hot_deals_votes;
ALTER VIEW public.hot_deals_votes_public SET (security_invoker = off);
GRANT SELECT ON public.hot_deals_votes_public TO anon, authenticated;

-- 3. venezuela_rebuild_donations: remove public row access, expose sanitized view
DROP POLICY IF EXISTS "Anyone can view completed donations" ON public.venezuela_rebuild_donations;

CREATE POLICY "Donors view their own donations"
ON public.venezuela_rebuild_donations
FOR SELECT TO authenticated
USING (donor_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE VIEW public.venezuela_rebuild_donations_public
WITH (security_invoker = off) AS
SELECT id, company_id, donor_name, amount_cents, message, created_at
FROM public.venezuela_rebuild_donations
WHERE status = 'completed';
GRANT SELECT ON public.venezuela_rebuild_donations_public TO anon, authenticated;

-- 4. profiles_data: block direct reads; masked public.profiles view is the only path
CREATE OR REPLACE FUNCTION public.can_see_profile_contact(_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT (auth.uid() IS NOT NULL AND auth.uid() = _owner)
      OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

ALTER VIEW public.profiles SET (security_invoker = off);
REVOKE SELECT ON public.profiles_data FROM anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- INSTEAD OF trigger functions must run with owner rights now, with ownership checks
CREATE OR REPLACE FUNCTION public.profiles_view_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR (NEW.user_id IS DISTINCT FROM auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  INSERT INTO public.profiles_data (
    id, user_id, full_name, email, avatar_url, bio, location, website, linkedin_url,
    is_online, last_seen, is_official_mentor, resume_url, venezuela_rebuild, industry
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()), NEW.user_id, NEW.full_name, NEW.email, NEW.avatar_url,
    NEW.bio, NEW.location, NEW.website, NEW.linkedin_url,
    COALESCE(NEW.is_online, false), NEW.last_seen, COALESCE(NEW.is_official_mentor, false),
    NEW.resume_url, COALESCE(NEW.venezuela_rebuild, false), NEW.industry
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_view_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR (OLD.user_id IS DISTINCT FROM auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles_data d SET
    full_name = NEW.full_name,
    email = COALESCE(NEW.email, d.email),
    avatar_url = NEW.avatar_url,
    bio = NEW.bio,
    location = NEW.location,
    website = NEW.website,
    linkedin_url = NEW.linkedin_url,
    is_online = NEW.is_online,
    last_seen = NEW.last_seen,
    is_official_mentor = NEW.is_official_mentor,
    resume_url = COALESCE(NEW.resume_url, d.resume_url),
    venezuela_rebuild = NEW.venezuela_rebuild,
    industry = NEW.industry,
    followers_count = NEW.followers_count,
    following_count = NEW.following_count,
    profile_views_count = NEW.profile_views_count,
    update_count = NEW.update_count,
    last_profile_update = NEW.last_profile_update,
    updated_at = now()
  WHERE d.id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_view_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR (OLD.user_id IS DISTINCT FROM auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.profiles_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- 5. SECURITY DEFINER functions: revoke execute where it is not needed
REVOKE EXECUTE ON FUNCTION public.notify_calendar_booking_created() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_calendar_booking_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_roles_batch(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_earth_intelligence_bonus(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_lightpaper_projects(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_grant_official_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_online_status(uuid, boolean) FROM anon;
