-- 1. Internal SECURITY DEFINER helpers should not be callable from the API
REVOKE EXECUTE ON FUNCTION public.is_live_room_participant(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_earth_intelligence_bonus(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_lightpaper_share_link_by_token(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_and_grant_official_status(uuid) FROM anon;

-- 2. corporate_partners: hide contact_email / contact_phone from public reads
REVOKE SELECT ON public.corporate_partners FROM anon, authenticated;
GRANT SELECT (id, company_name, contact_name, company_website, company_size, partnership_type, partnership_interests, logo_url, is_featured, status, created_at, updated_at)
  ON public.corporate_partners TO anon, authenticated;

-- 3. profiles_data: no direct reads of email / resume_url; masked `profiles` view remains the path
REVOKE SELECT ON public.profiles_data FROM anon, authenticated;
GRANT SELECT (id, user_id, full_name, avatar_url, bio, location, website, linkedin_url, created_at, updated_at,
              last_profile_update, update_count, followers_count, following_count, profile_views_count,
              is_online, last_seen, industry, is_official_mentor, venezuela_rebuild)
  ON public.profiles_data TO anon, authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated;