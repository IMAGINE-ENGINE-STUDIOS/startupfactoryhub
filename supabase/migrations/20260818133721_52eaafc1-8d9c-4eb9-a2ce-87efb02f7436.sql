CREATE OR REPLACE FUNCTION public.get_corporate_partners_admin()
RETURNS SETOF public.corporate_partners
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.corporate_partners ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_corporate_partners_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_corporate_partners_admin() TO authenticated, service_role;