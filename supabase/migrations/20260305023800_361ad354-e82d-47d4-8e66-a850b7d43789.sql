
-- 1. Create official_mentor_invitations table
CREATE TABLE public.official_mentor_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.official_mentor_invitations ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage invitations"
  ON public.official_mentor_invitations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own invitation by token (handled via edge function mostly)
CREATE POLICY "Users can read own invitation"
  ON public.official_mentor_invitations
  FOR SELECT
  TO authenticated
  USING (accepted_by = auth.uid());

-- Allow anon select for token verification during acceptance
CREATE POLICY "Anyone can verify token"
  ON public.official_mentor_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Create official_mentor_status table
CREATE TABLE public.official_mentor_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  invitation_id uuid REFERENCES public.official_mentor_invitations(id) ON DELETE SET NULL,
  profile_completed boolean NOT NULL DEFAULT false,
  email_verified boolean NOT NULL DEFAULT false,
  connection_invited boolean NOT NULL DEFAULT false,
  is_official boolean NOT NULL DEFAULT false,
  referral_commission_rate numeric NOT NULL DEFAULT 0.25,
  granted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.official_mentor_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own status"
  ON public.official_mentor_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all status"
  ON public.official_mentor_status
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own status"
  ON public.official_mentor_status
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Add is_official_mentor column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_official_mentor boolean NOT NULL DEFAULT false;

-- 4. Create check_and_grant_official_status function
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
  -- Check if user has official_mentor_status row
  SELECT EXISTS(SELECT 1 FROM public.official_mentor_status WHERE user_id = p_user_id) INTO v_status_exists;
  IF NOT v_status_exists THEN
    RETURN jsonb_build_object('error', 'Not enrolled in official program');
  END IF;

  -- Check profile completeness
  SELECT (full_name IS NOT NULL AND full_name != '' AND
          bio IS NOT NULL AND bio != '' AND
          avatar_url IS NOT NULL AND avatar_url != '' AND
          linkedin_url IS NOT NULL AND linkedin_url != '')
  INTO v_profile_complete
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Check email verified (from auth.users - security definer allows this)
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

  -- Update status record
  UPDATE public.official_mentor_status
  SET profile_completed = COALESCE(v_profile_complete, false),
      email_verified = COALESCE(v_email_verified, false),
      connection_invited = v_has_connection,
      is_official = v_all_complete,
      granted_at = CASE WHEN v_all_complete THEN now() ELSE NULL END
  WHERE user_id = p_user_id;

  -- Update profiles flag
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
