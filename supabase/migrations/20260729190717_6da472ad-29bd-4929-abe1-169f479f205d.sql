ALTER TABLE public.profiles RENAME TO profiles_data;

CREATE OR REPLACE FUNCTION public.can_see_profile_contact(_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT current_user IN ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin')
      OR (auth.uid() IS NOT NULL AND auth.uid() = _owner)
      OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

CREATE VIEW public.profiles WITH (security_invoker = on) AS
SELECT
  d.id,
  d.user_id,
  CASE WHEN public.can_see_profile_contact(d.user_id) THEN d.email END AS email,
  d.full_name,
  d.avatar_url,
  d.bio,
  d.location,
  d.website,
  d.linkedin_url,
  d.created_at,
  d.updated_at,
  d.last_profile_update,
  d.update_count,
  d.followers_count,
  d.following_count,
  d.profile_views_count,
  d.is_online,
  d.last_seen,
  CASE WHEN public.can_see_profile_contact(d.user_id) THEN d.resume_url END AS resume_url,
  d.industry,
  d.is_official_mentor,
  d.venezuela_rebuild
FROM public.profiles_data d;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.profiles_view_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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
SET search_path = public
AS $$
BEGIN
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
    industry = NEW.industry
  WHERE d.id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_view_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER profiles_view_insert_trg INSTEAD OF INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_view_insert();

CREATE TRIGGER profiles_view_update_trg INSTEAD OF UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_view_update();

CREATE TRIGGER profiles_view_delete_trg INSTEAD OF DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_view_delete();