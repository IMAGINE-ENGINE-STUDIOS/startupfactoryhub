
ALTER FUNCTION public.update_advisor_job_tasks_updated_at() SET search_path = public;
ALTER FUNCTION public.validate_recording_session_status() SET search_path = public;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid
    WHERE n.nspname='public' AND p.prosecdef=true AND p.prorettype='trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.assign_user_role(text, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_notification_email(text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_cursors() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_online_status() FROM PUBLIC, anon;

DROP POLICY IF EXISTS "System can create achievements" ON public.achievements;
CREATE POLICY "Service role can create achievements"
ON public.achievements FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Users can create their own achievements"
ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view comments on shared projects" ON public.document_comments;
CREATE POLICY "Project owners can view comments"
ON public.document_comments FOR SELECT TO authenticated
USING (
  project_id IN (SELECT id FROM public.lightpaper_projects WHERE user_id = auth.uid())
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Anyone can view cursors on shared projects" ON public.document_cursors;
CREATE POLICY "Project owners can view cursors"
ON public.document_cursors FOR SELECT TO authenticated
USING (
  project_id IN (SELECT id FROM public.lightpaper_projects WHERE user_id = auth.uid())
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Anyone can view donations" ON public.hot_deals_donations;
DROP POLICY IF EXISTS "Anyone can create pending donations" ON public.hot_deals_donations;
CREATE POLICY "Admins can view donations"
ON public.hot_deals_donations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert donations"
ON public.hot_deals_donations FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view invited startups" ON public.hot_deals_invited_startups;
CREATE POLICY "Authenticated users can view invited startups"
ON public.hot_deals_invited_startups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view share links by token" ON public.lightpaper_share_links;

CREATE OR REPLACE FUNCTION public.get_lightpaper_share_link_by_token(_token text)
RETURNS TABLE(id uuid, project_id uuid, share_token text, access_type text, expires_at timestamptz, password_protected boolean, view_count integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, project_id, share_token, access_type, expires_at,
         (password_hash IS NOT NULL) AS password_protected,
         view_count, created_at
  FROM public.lightpaper_share_links
  WHERE share_token = _token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_lightpaper_share_link_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lightpaper_share_link_by_token(text) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can create profile views" ON public.profile_views;
CREATE POLICY "Authenticated users can insert their own views"
ON public.profile_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Anyone can update website visitors" ON public.website_visitor_log;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;
CREATE POLICY "Company logos accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Anyone can view event banners" ON storage.objects;
CREATE POLICY "Event banners accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'event-banners');

DROP POLICY IF EXISTS "Anyone can view feed media" ON storage.objects;
CREATE POLICY "Feed media accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'feed-media');

DROP POLICY IF EXISTS "Anyone can view pitch decks" ON storage.objects;
CREATE POLICY "Pitch decks accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pitch-decks');

DROP POLICY IF EXISTS "Anyone can view resource assets" ON storage.objects;
CREATE POLICY "Resource assets accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resource-assets');

DROP POLICY IF EXISTS "AI generated images are publicly accessible" ON storage.objects;
CREATE POLICY "AI generated images accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ai-generated-images');

DROP POLICY IF EXISTS "AR content is publicly accessible" ON storage.objects;
CREATE POLICY "AR content accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ar-content');

DROP POLICY IF EXISTS "Anyone can read camera snapshots storage" ON storage.objects;
CREATE POLICY "Camera snapshots accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'camera-snapshots');

DROP POLICY IF EXISTS "Anyone can read dj recordings" ON storage.objects;
CREATE POLICY "DJ recordings accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'dj-recordings');

DROP POLICY IF EXISTS "Public video access" ON storage.objects;
CREATE POLICY "Videos accessible to authenticated users"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'videos');
