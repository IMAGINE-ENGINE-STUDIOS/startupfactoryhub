ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_resources_is_emergency
  ON public.resources(is_emergency) WHERE is_emergency = true;

CREATE OR REPLACE FUNCTION public.auto_verify_emergency_resource()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_emergency = true THEN
    NEW.is_verified := true;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_verify_emergency_resource() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_auto_verify_emergency_resource ON public.resources;
CREATE TRIGGER trg_auto_verify_emergency_resource
  BEFORE INSERT ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_emergency_resource();