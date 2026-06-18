
-- 1. admin_audit_logs
DROP POLICY IF EXISTS "System can insert audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Service role can insert audit_logs"
  ON public.admin_audit_logs FOR INSERT TO service_role
  WITH CHECK (true);

-- 2. ai_insights
DROP POLICY IF EXISTS "System can create insights" ON public.ai_insights;
CREATE POLICY "Service role can create insights"
  ON public.ai_insights FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "Users can create insights for themselves"
  ON public.ai_insights FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. application_invitations
DROP POLICY IF EXISTS "System can update invitations" ON public.application_invitations;
CREATE POLICY "Service role can update invitations"
  ON public.application_invitations FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

-- 4. conversations
DROP POLICY IF EXISTS "System can manage conversations" ON public.conversations;
CREATE POLICY "Service role manages conversations"
  ON public.conversations FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Participants can insert their conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Participants can update their conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 5. event_external_registrations
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.event_external_registrations;
CREATE POLICY "Organizers can view registrations"
  ON public.event_external_registrations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_external_registrations.event_id
        AND e.organizer_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- 6. event_payments
DROP POLICY IF EXISTS "Service role can manage event payments" ON public.event_payments;
CREATE POLICY "Service role can manage event payments"
  ON public.event_payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 7. hot_deals_agenda: drop write policies, keep SELECT
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, cmd FROM pg_policies
    WHERE schemaname='public' AND tablename='hot_deals_agenda'
  LOOP
    IF pol.cmd <> 'SELECT' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.hot_deals_agenda', pol.policyname);
    END IF;
  END LOOP;
END $$;
CREATE POLICY "Admins manage hot_deals_agenda"
  ON public.hot_deals_agenda FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. hot_deals_donations
DROP POLICY IF EXISTS "Service role can update donations" ON public.hot_deals_donations;
CREATE POLICY "Service role can update donations"
  ON public.hot_deals_donations FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

-- 9. hot_deals_winner
DROP POLICY IF EXISTS "Only authenticated can announce winner" ON public.hot_deals_winner;
CREATE POLICY "Admins can announce winner"
  ON public.hot_deals_winner FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can announce winner"
  ON public.hot_deals_winner FOR INSERT TO service_role
  WITH CHECK (true);

-- 10. intern_invitations
DROP POLICY IF EXISTS "Public can read invitation by token" ON public.intern_invitations;
CREATE POLICY "Admins can read intern invitations"
  ON public.intern_invitations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_intern_invitation_by_token(_token uuid)
RETURNS TABLE (id uuid, email text, full_name text, status text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, email, full_name, status, expires_at
  FROM public.intern_invitations
  WHERE invite_token = _token
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_intern_invitation_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_intern_invitation_by_token(uuid) TO anon, authenticated;

-- 11. market_themes
DROP POLICY IF EXISTS "Authenticated users can manage market themes" ON public.market_themes;
CREATE POLICY "Admins can manage market themes"
  ON public.market_themes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Service role can create notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);
CREATE POLICY "Users can create their own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 13. official_mentor_invitations
DROP POLICY IF EXISTS "Anyone can verify token" ON public.official_mentor_invitations;
CREATE POLICY "Admins can read official mentor invitations"
  ON public.official_mentor_invitations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_official_mentor_invitation_by_token(_token text)
RETURNS TABLE (id uuid, email text, status text, expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, email, status, expires_at
  FROM public.official_mentor_invitations
  WHERE invitation_token = _token
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_official_mentor_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_official_mentor_invitation_by_token(text) TO anon, authenticated;

-- 14. security_logs
DROP POLICY IF EXISTS "System can create security logs" ON public.security_logs;
CREATE POLICY "Service role can create security logs"
  ON public.security_logs FOR INSERT TO service_role
  WITH CHECK (true);

-- 15. user_subscriptions
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
