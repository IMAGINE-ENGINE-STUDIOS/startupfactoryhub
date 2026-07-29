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