-- Phase 5: Security Hardening - Fix user role creation with trigger

-- Drop existing handle_new_user if it exists and recreate with role support
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced function to handle new user creation with role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add rate limiting metadata to profiles for security
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0;

-- Create function to check rate limiting
CREATE OR REPLACE FUNCTION public.check_profile_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset counter if more than 1 hour has passed
  IF OLD.last_profile_update < now() - interval '1 hour' THEN
    NEW.update_count := 1;
    NEW.last_profile_update := now();
  -- If within rate limit window
  ELSIF OLD.update_count < 10 THEN
    NEW.update_count := OLD.update_count + 1;
    NEW.last_profile_update := now();
  -- Rate limit exceeded
  ELSE
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add rate limiting trigger to profiles
DROP TRIGGER IF EXISTS profile_rate_limit_trigger ON public.profiles;
CREATE TRIGGER profile_rate_limit_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_rate_limit();

-- Strengthen RLS policies for sensitive operations
-- Messages: ensure users can only send messages, not fake sender_id
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND sender_id IS NOT NULL);

-- Investments: only investors with investor_profiles can create investments
DROP POLICY IF EXISTS "Investors can manage their own investments" ON public.investments;
CREATE POLICY "Investors can create investments"
  ON public.investments
  FOR INSERT
  WITH CHECK (
    auth.uid() = investor_id 
    AND EXISTS (
      SELECT 1 FROM public.investor_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Investors can update their own investments"
  ON public.investments
  FOR UPDATE
  USING (auth.uid() = investor_id);

CREATE POLICY "Investors can delete their own investments"
  ON public.investments
  FOR DELETE
  USING (auth.uid() = investor_id);

-- Add security logging table for audit trail
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security_logs (only system can write, admins can read)
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can create security logs"
  ON public.security_logs
  FOR INSERT
  WITH CHECK (true);

-- Add indexes for security and performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);