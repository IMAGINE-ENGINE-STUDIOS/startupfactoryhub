-- Enable full row data for realtime updates on profiles
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add profiles table to Supabase Realtime publication (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;