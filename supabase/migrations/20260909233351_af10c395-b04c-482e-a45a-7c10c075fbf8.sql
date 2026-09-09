REVOKE ALL ON FUNCTION public.validate_profile_view() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_profile_view() TO service_role;