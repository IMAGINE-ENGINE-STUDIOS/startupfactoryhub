-- Fix function search path for security
ALTER FUNCTION public.check_profile_rate_limit() SET search_path = public;