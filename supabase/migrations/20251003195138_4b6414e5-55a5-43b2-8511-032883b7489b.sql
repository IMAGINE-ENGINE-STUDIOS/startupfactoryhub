-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'startup', 'investor', 'mentor', 'advisor', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY created_at ASC
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage user roles"
  ON public.user_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Add trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add AI-related metadata columns to existing tables
ALTER TABLE public.feed_posts 
  ADD COLUMN IF NOT EXISTS ai_summary_id UUID REFERENCES public.ai_summaries(id),
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS sentiment_label TEXT;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS ai_summary_id UUID REFERENCES public.ai_summaries(id),
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS translated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_language TEXT,
  ADD COLUMN IF NOT EXISTS sentiment_score NUMERIC(3,2);

-- Create indexes for AI columns
CREATE INDEX IF NOT EXISTS idx_feed_posts_ai_summary ON public.feed_posts(ai_summary_id);
CREATE INDEX IF NOT EXISTS idx_companies_ai_summary ON public.companies(ai_summary_id);
CREATE INDEX IF NOT EXISTS idx_messages_translated ON public.messages(translated);

-- Enable realtime for AI tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;