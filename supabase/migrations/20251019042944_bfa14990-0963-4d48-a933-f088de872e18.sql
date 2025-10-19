-- Add online status tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Create index for efficient online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);

-- Function to automatically update last_seen when a user goes online
CREATE OR REPLACE FUNCTION public.update_user_online_status(p_user_id uuid, p_is_online boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_online = p_is_online,
    last_seen = CASE WHEN p_is_online = false THEN now() ELSE last_seen END
  WHERE user_id = p_user_id;
END;
$$;

-- Function to automatically mark users as offline after 5 minutes of inactivity
CREATE OR REPLACE FUNCTION public.cleanup_stale_online_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_online = false
  WHERE is_online = true 
  AND last_seen < now() - interval '5 minutes';
END;
$$;