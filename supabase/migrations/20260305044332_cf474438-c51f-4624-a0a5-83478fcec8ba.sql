-- Update check_and_grant_official_status to only require avatar (not bio/linkedin)
CREATE OR REPLACE FUNCTION public.check_and_grant_official_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_complete boolean;
  v_email_verified boolean;
  v_has_connection boolean;
  v_all_complete boolean;
  v_status_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.official_mentor_status WHERE user_id = p_user_id) INTO v_status_exists;
  IF NOT v_status_exists THEN
    RETURN jsonb_build_object('error', 'Not enrolled in official program');
  END IF;

  -- Profile complete = just needs avatar uploaded
  SELECT (avatar_url IS NOT NULL AND avatar_url != '')
  INTO v_profile_complete
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Check email verified
  SELECT (email_confirmed_at IS NOT NULL)
  INTO v_email_verified
  FROM auth.users
  WHERE id = p_user_id;

  -- Check has at least 1 accepted connection
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
    UPDATE public.profiles SET is_official_mentor = true WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'profile_completed', COALESCE(v_profile_complete, false),
    'email_verified', COALESCE(v_email_verified, false),
    'connection_invited', v_has_connection,
    'is_official', v_all_complete
  );
END;
$$;