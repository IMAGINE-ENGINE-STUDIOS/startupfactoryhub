-- 1. Security definer view -> invoker, with column-level grants so emails stay hidden
ALTER VIEW public.hot_deals_votes_public SET (security_invoker = on);

CREATE POLICY "Public can view vote tallies"
ON public.hot_deals_votes
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT (id, startup_id, voter_name, rating, vote_code, created_at)
ON public.hot_deals_votes TO anon, authenticated;

-- 2. Revoke EXECUTE on backend-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.consume_genius_turn(uuid, bigint, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_session_stats(uuid, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_storage_usage(uuid, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_startup_announcement() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_genius_turn(uuid, bigint, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_session_stats(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_storage_usage(uuid, bigint) TO service_role;

-- 3. Client-callable definer functions: restrict to the caller's own account
REVOKE EXECUTE ON FUNCTION public.check_and_grant_official_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_online_status(uuid, boolean) FROM anon;

CREATE OR REPLACE FUNCTION public.check_and_grant_official_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_complete boolean;
  v_email_verified boolean;
  v_has_connection boolean;
  v_all_complete boolean;
  v_status_exists boolean;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.official_mentor_status WHERE user_id = p_user_id) INTO v_status_exists;
  IF NOT v_status_exists THEN
    RETURN jsonb_build_object('error', 'Not enrolled in official program');
  END IF;

  SELECT (avatar_url IS NOT NULL AND avatar_url != '')
  INTO v_profile_complete
  FROM public.profiles_data
  WHERE user_id = p_user_id;

  SELECT (email_confirmed_at IS NOT NULL)
  INTO v_email_verified
  FROM auth.users
  WHERE id = p_user_id;

  SELECT EXISTS(
    SELECT 1 FROM public.connections
    WHERE (requester_id = p_user_id OR addressee_id = p_user_id)
    AND status = 'accepted'
  ) INTO v_has_connection;

  v_all_complete := COALESCE(v_profile_complete, false) AND COALESCE(v_email_verified, false) AND v_has_connection;

  UPDATE public.official_mentor_status
  SET profile_completed = COALESCE(v_profile_complete, false),
      email_verified = COALESCE(v_email_verified, false),
      connection_invited = v_has_connection,
      is_official = v_all_complete,
      granted_at = CASE WHEN v_all_complete THEN now() ELSE NULL END
  WHERE user_id = p_user_id;

  IF v_all_complete THEN
    UPDATE public.profiles_data SET is_official_mentor = true WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'profile_completed', COALESCE(v_profile_complete, false),
    'email_verified', COALESCE(v_email_verified, false),
    'connection_invited', v_has_connection,
    'is_official', v_all_complete
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_online_status(p_user_id uuid, p_is_online boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles_data
  SET
    is_online = p_is_online,
    last_seen = CASE WHEN p_is_online = false THEN now() ELSE last_seen END
  WHERE user_id = p_user_id;
END;
$function$;