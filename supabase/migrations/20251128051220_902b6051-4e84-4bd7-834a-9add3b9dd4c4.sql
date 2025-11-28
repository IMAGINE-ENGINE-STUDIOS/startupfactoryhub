-- 1. Fix the investments table INSERT policy to use has_role() function
DROP POLICY IF EXISTS "Investors can create investments" ON investments;

CREATE POLICY "Investors can create investments" ON investments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = investor_id 
  AND public.has_role(auth.uid(), 'investor')
);

-- 2. Update handle_new_user() to create role-specific profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Extract role from metadata, default to 'startup' if not provided
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'startup'::public.app_role
  );

  -- Insert profile first
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Then insert role (this ensures atomic creation)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create role-specific profiles
  IF user_role = 'investor' THEN
    INSERT INTO public.investor_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'mentor' THEN
    INSERT INTO public.mentor_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Backfill existing investor users missing investor_profiles
INSERT INTO public.investor_profiles (user_id)
SELECT ur.user_id 
FROM public.user_roles ur
LEFT JOIN public.investor_profiles ip ON ur.user_id = ip.user_id
WHERE ur.role = 'investor' AND ip.user_id IS NULL;

-- 4. Backfill existing mentor users missing mentor_profiles
INSERT INTO public.mentor_profiles (user_id)
SELECT ur.user_id 
FROM public.user_roles ur
LEFT JOIN public.mentor_profiles mp ON ur.user_id = mp.user_id
WHERE ur.role = 'mentor' AND mp.user_id IS NULL;