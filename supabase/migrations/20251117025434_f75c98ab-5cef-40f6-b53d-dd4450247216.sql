-- Helper function to assign role to existing user
CREATE OR REPLACE FUNCTION public.assign_user_role(
  _user_email TEXT,
  _role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Get user_id from auth.users by email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _user_email;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _user_email;
  END IF;

  -- Insert role (or do nothing if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Role % assigned to user %', _role, _user_email;
END;
$$;

-- SQL commands to run AFTER creating users in Supabase dashboard:
-- 
-- SELECT public.assign_user_role('startup@test.com', 'startup');
-- SELECT public.assign_user_role('advisor@test.com', 'advisor');
-- SELECT public.assign_user_role('investor@test.com', 'investor');
-- SELECT public.assign_user_role('mentor@test.com', 'mentor');
-- SELECT public.assign_user_role('student@test.com', 'student');