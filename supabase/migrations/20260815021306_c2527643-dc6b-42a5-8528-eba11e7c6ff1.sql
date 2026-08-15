-- 1. PROFILES: masked contact via definer helpers + column-level grants
CREATE OR REPLACE FUNCTION public.profile_contact_email(_owner uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.can_see_profile_contact(_owner)
    THEN (SELECT d.email FROM public.profiles_data d WHERE d.user_id = _owner)
    ELSE NULL END;
$$;

CREATE OR REPLACE FUNCTION public.profile_contact_resume(_owner uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.can_see_profile_contact(_owner)
    THEN (SELECT d.resume_url FROM public.profiles_data d WHERE d.user_id = _owner)
    ELSE NULL END;
$$;

REVOKE ALL ON FUNCTION public.profile_contact_email(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.profile_contact_resume(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_contact_email(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.profile_contact_resume(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.profiles
WITH (security_invoker = on) AS
SELECT d.id, d.user_id,
  public.profile_contact_email(d.user_id) AS email,
  d.full_name, d.avatar_url, d.bio, d.location, d.website, d.linkedin_url,
  d.created_at, d.updated_at, d.last_profile_update, d.update_count,
  d.followers_count, d.following_count, d.profile_views_count,
  d.is_online, d.last_seen,
  public.profile_contact_resume(d.user_id) AS resume_url,
  d.industry, d.is_official_mentor, d.venezuela_rebuild
FROM public.profiles_data d;

REVOKE SELECT ON public.profiles_data FROM anon, authenticated;
GRANT SELECT (id, user_id, full_name, avatar_url, bio, location, website, linkedin_url,
  created_at, updated_at, last_profile_update, update_count, followers_count, following_count,
  profile_views_count, is_online, last_seen, industry, is_official_mentor, venezuela_rebuild)
ON public.profiles_data TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles_data;
CREATE POLICY "Public can view basic profiles" ON public.profiles_data
FOR SELECT TO anon USING (true);

-- 2. CORPORATE PARTNERS public view
DROP POLICY IF EXISTS "Public can view featured approved partners" ON public.corporate_partners;
CREATE POLICY "Public can view featured approved partners" ON public.corporate_partners
FOR SELECT TO anon, authenticated USING (is_featured = true AND status = 'approved');

REVOKE SELECT ON public.corporate_partners FROM anon, authenticated;
GRANT SELECT (id, company_name, company_website, company_size, partnership_type,
  partnership_interests, logo_url, is_featured, created_at, status)
ON public.corporate_partners TO anon, authenticated;

CREATE OR REPLACE VIEW public.corporate_partners_public
WITH (security_invoker = on) AS
SELECT id, company_name, company_website, company_size, partnership_type,
  partnership_interests, logo_url, is_featured, created_at
FROM public.corporate_partners
WHERE is_featured = true AND status = 'approved';
GRANT SELECT ON public.corporate_partners_public TO anon, authenticated;

-- 3. HOT DEALS VOTES public view
DROP POLICY IF EXISTS "Public can view non-sensitive votes" ON public.hot_deals_votes;
CREATE POLICY "Public can view non-sensitive votes" ON public.hot_deals_votes
FOR SELECT TO anon, authenticated USING (true);

REVOKE SELECT ON public.hot_deals_votes FROM anon, authenticated;
GRANT SELECT (id, startup_id, voter_name, rating, vote_code, created_at)
ON public.hot_deals_votes TO anon, authenticated;

CREATE OR REPLACE VIEW public.hot_deals_votes_public
WITH (security_invoker = on) AS
SELECT id, startup_id, voter_name, rating, vote_code, created_at
FROM public.hot_deals_votes;
GRANT SELECT ON public.hot_deals_votes_public TO anon, authenticated;

-- 4. VENEZUELA DONATIONS public view
DROP POLICY IF EXISTS "Public can view completed donations" ON public.venezuela_rebuild_donations;
CREATE POLICY "Public can view completed donations" ON public.venezuela_rebuild_donations
FOR SELECT TO anon, authenticated USING (status = 'completed');

REVOKE SELECT ON public.venezuela_rebuild_donations FROM anon, authenticated;
GRANT SELECT (id, company_id, donor_name, amount_cents, message, created_at, status, donor_user_id)
ON public.venezuela_rebuild_donations TO anon, authenticated;

CREATE OR REPLACE VIEW public.venezuela_rebuild_donations_public
WITH (security_invoker = on) AS
SELECT id, company_id, donor_name, amount_cents, message, created_at
FROM public.venezuela_rebuild_donations
WHERE status = 'completed';
GRANT SELECT ON public.venezuela_rebuild_donations_public TO anon, authenticated;

-- 5. BLOG LIKES: guests can no longer delete arbitrary rows
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.blog_likes;
CREATE POLICY "Users can remove their own likes" ON public.blog_likes
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_guest_blog_like(_post_id uuid, _guest_identifier text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _exists boolean;
BEGIN
  IF _guest_identifier IS NULL OR length(trim(_guest_identifier)) < 8 THEN
    RAISE EXCEPTION 'Invalid guest identifier';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.blog_likes
    WHERE post_id = _post_id AND guest_identifier = _guest_identifier) INTO _exists;
  IF _exists THEN
    DELETE FROM public.blog_likes
      WHERE post_id = _post_id AND guest_identifier = _guest_identifier;
    RETURN false;
  END IF;
  INSERT INTO public.blog_likes (post_id, user_id, guest_identifier)
  VALUES (_post_id, NULL, _guest_identifier);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.toggle_guest_blog_like(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_guest_blog_like(uuid, text) TO anon, authenticated, service_role;

-- 6. STORAGE: ownership checks on resource-assets
DROP POLICY IF EXISTS "Authenticated users can update resource assets" ON storage.objects;
CREATE POLICY "Users can update their own resource assets" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'resource-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'resource-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can delete resource assets" ON storage.objects;
CREATE POLICY "Users can delete their own resource assets" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'resource-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can upload resource assets" ON storage.objects;
CREATE POLICY "Users can upload their own resource assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resource-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Revoke EXECUTE on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.profiles_view_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_view_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_view_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_calendar_booking_created() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_calendar_booking_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_live_room_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_live_room_participant(uuid, uuid) TO anon, authenticated, service_role;