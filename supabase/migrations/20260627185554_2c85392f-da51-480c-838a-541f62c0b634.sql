ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS confirmations_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.confirm_emergency_resource(_resource_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.resources
    SET confirmations_count = COALESCE(confirmations_count, 0) + 1
    WHERE id = _resource_id AND is_emergency = true
    RETURNING confirmations_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_emergency_resource(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_emergency_resource(UUID) TO anon, authenticated;