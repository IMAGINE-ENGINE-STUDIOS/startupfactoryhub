-- 1. SECURITY DEFINER function execution grants
REVOKE EXECUTE ON FUNCTION public.cleanup_old_cursors() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_online_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_startup_announcement() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_and_grant_official_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_genius_turn(uuid, bigint, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_roles_batch(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_earth_intelligence_bonus(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_session_stats(uuid, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_storage_usage(uuid, bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_lightpaper_projects(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_online_status(uuid, boolean) FROM anon;

-- 2. hot_deals_chat: no impersonation, no unbounded free text
DROP POLICY IF EXISTS "Anyone can send chat messages" ON public.hot_deals_chat;

CREATE POLICY "Guests can send anonymous chat messages"
ON public.hot_deals_chat FOR INSERT TO anon
WITH CHECK (
  char_length(btrim(sender_name)) BETWEEN 1 AND 40
  AND char_length(btrim(message)) BETWEEN 1 AND 500
);

CREATE POLICY "Authenticated users post under their own name"
ON public.hot_deals_chat FOR INSERT TO authenticated
WITH CHECK (
  char_length(btrim(sender_name)) BETWEEN 1 AND 40
  AND char_length(btrim(message)) BETWEEN 1 AND 500
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND btrim(sender_name) = btrim(COALESCE(p.full_name, p.email))
  )
);

-- 3. hot_deals_votes: hide voter emails
DROP POLICY IF EXISTS "Anyone can view votes" ON public.hot_deals_votes;
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.hot_deals_votes;

CREATE POLICY "Admins can view votes"
ON public.hot_deals_votes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can cast a valid vote"
ON public.hot_deals_votes FOR INSERT TO anon, authenticated
WITH CHECK (
  rating BETWEEN 1 AND 5
  AND char_length(btrim(voter_name)) BETWEEN 1 AND 80
  AND (voter_email IS NULL OR voter_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE OR REPLACE VIEW public.hot_deals_votes_public
WITH (security_invoker = off) AS
SELECT id, startup_id, voter_name, rating, vote_code, created_at
FROM public.hot_deals_votes;

GRANT SELECT ON public.hot_deals_votes_public TO anon, authenticated;
GRANT ALL ON public.hot_deals_votes_public TO service_role;

-- 4. Blog: no anonymous authoring
DROP POLICY IF EXISTS "Anyone can create blog posts" ON public.blog_posts;
CREATE POLICY "Users can create their own blog posts"
ON public.blog_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create blog comments" ON public.blog_comments;
CREATE POLICY "Users can create their own blog comments"
ON public.blog_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND char_length(btrim(content)) BETWEEN 1 AND 2000);

DROP POLICY IF EXISTS "Anyone can create blog likes" ON public.blog_likes;
CREATE POLICY "Users can create their own blog likes"
ON public.blog_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. System-ish tables no longer writable by logged-out visitors
DROP POLICY IF EXISTS "System can create translations" ON public.ai_translations;
CREATE POLICY "Authenticated users can create translations"
ON public.ai_translations FOR INSERT TO authenticated
WITH CHECK (char_length(original_text) <= 20000);

DROP POLICY IF EXISTS "System can create activity logs" ON public.lightpaper_activity;
CREATE POLICY "Users can create their own activity logs"
ON public.lightpaper_activity FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Storage: stop bucket-wide listing
DROP POLICY IF EXISTS "Members can view files from their study rooms" ON storage.objects;
CREATE POLICY "Members can view files from their study rooms"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'study-room-files'
  AND EXISTS (
    SELECT 1 FROM public.study_group_members m
    WHERE m.group_id::text = (storage.foldername(name))[1]
      AND m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Videos accessible to authenticated users" ON storage.objects;
CREATE POLICY "Users can list their own videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos' AND auth.uid() = owner);