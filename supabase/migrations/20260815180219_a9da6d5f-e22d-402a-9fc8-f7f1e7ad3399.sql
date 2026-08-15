CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role public.app_role;
  is_vzla boolean;
BEGIN
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'startup'::public.app_role
  );

  is_vzla := COALESCE((NEW.raw_user_meta_data->>'venezuela_rebuild')::boolean, false);

  -- Write directly to the base table: the profiles view has an INSTEAD OF trigger
  -- that requires auth.uid(), which is NULL during signup.
  INSERT INTO public.profiles_data (user_id, email, full_name, venezuela_rebuild)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    is_vzla
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF user_role = 'investor' THEN
    INSERT INTO public.investor_profiles (user_id)
    VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'mentor' THEN
    INSERT INTO public.mentor_profiles (user_id)
    VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'accelerator' THEN
    INSERT INTO public.accelerator_profiles (user_id, organization_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Accelerator'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block account creation because of profile bootstrapping.
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;