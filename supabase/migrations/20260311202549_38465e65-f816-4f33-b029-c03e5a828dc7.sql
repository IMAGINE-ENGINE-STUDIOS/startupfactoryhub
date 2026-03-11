
-- 1. recording_sessions table
CREATE TABLE public.recording_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camera_id text NOT NULL,
  camera_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz,
  snapshot_count int DEFAULT 0,
  total_size_bytes bigint DEFAULT 0,
  storage_path text,
  thumbnail_path text,
  status text DEFAULT 'recording',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recording_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recording sessions"
  ON public.recording_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recording sessions"
  ON public.recording_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recording sessions"
  ON public.recording_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recording sessions"
  ON public.recording_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. user_storage_usage table
CREATE TABLE public.user_storage_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes_used bigint DEFAULT 0,
  storage_plan text DEFAULT 'free',
  plan_limit_bytes bigint DEFAULT 1073741824,
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storage usage"
  ON public.user_storage_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storage usage"
  ON public.user_storage_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storage usage"
  ON public.user_storage_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. storage_overages table
CREATE TABLE public.storage_overages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gb_charged int NOT NULL,
  amount_cents int NOT NULL,
  stripe_invoice_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.storage_overages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storage overages"
  ON public.storage_overages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Add user_id to camera_snapshots
ALTER TABLE public.camera_snapshots ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. DB function to increment storage usage atomically
CREATE OR REPLACE FUNCTION public.increment_storage_usage(p_user_id uuid, p_bytes bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_storage_usage (user_id, total_bytes_used)
  VALUES (p_user_id, p_bytes)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_bytes_used = user_storage_usage.total_bytes_used + p_bytes,
    updated_at = now(),
    last_calculated_at = now();
END;
$$;

-- 6. DB function to increment recording session snapshot count and size
CREATE OR REPLACE FUNCTION public.increment_session_stats(p_session_id uuid, p_size_bytes bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.recording_sessions
  SET snapshot_count = snapshot_count + 1,
      total_size_bytes = total_size_bytes + p_size_bytes
  WHERE id = p_session_id;
END;
$$;

-- Validation trigger for recording_sessions status
CREATE OR REPLACE FUNCTION public.validate_recording_session_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status NOT IN ('recording', 'stopped', 'archived') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_recording_session_status_trigger
  BEFORE INSERT OR UPDATE ON public.recording_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_recording_session_status();
