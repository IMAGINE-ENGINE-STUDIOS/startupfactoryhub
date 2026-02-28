
-- Create table to store LinkedIn OAuth tokens per user
CREATE TABLE public.linkedin_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  linkedin_sub TEXT,
  linkedin_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.linkedin_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view their own linkedin tokens"
ON public.linkedin_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own linkedin tokens"
ON public.linkedin_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own linkedin tokens"
ON public.linkedin_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own linkedin tokens"
ON public.linkedin_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Service role needs access for edge functions
CREATE POLICY "Service role full access to linkedin tokens"
ON public.linkedin_tokens FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_linkedin_tokens_updated_at
BEFORE UPDATE ON public.linkedin_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
