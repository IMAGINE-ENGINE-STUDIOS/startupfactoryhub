
-- 1. CRITICAL: Remove privilege escalation policy on user_roles
DROP POLICY IF EXISTS "System can manage user roles" ON public.user_roles;

-- 2. Restrict UPDATE on artemis_visitor_log (was open to anyone)
DROP POLICY IF EXISTS "Anyone can update own session" ON public.artemis_visitor_log;
CREATE POLICY "Authenticated users can update own session"
ON public.artemis_visitor_log
FOR UPDATE
TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

-- 3. Hide password_hash on lightpaper_share_links via column-level revoke
REVOKE SELECT (password_hash) ON public.lightpaper_share_links FROM anon, authenticated;

-- 4. Harden flight_pass_requests: hide plaintext credentials from client roles
REVOKE SELECT (frontier_username, frontier_password) ON public.flight_pass_requests FROM anon, authenticated;
REVOKE UPDATE (frontier_username, frontier_password) ON public.flight_pass_requests FROM anon, authenticated;
REVOKE INSERT (frontier_username, frontier_password) ON public.flight_pass_requests FROM anon, authenticated;
