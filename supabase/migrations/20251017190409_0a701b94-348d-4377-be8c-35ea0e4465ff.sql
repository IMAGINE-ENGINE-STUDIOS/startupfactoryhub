-- Create follows table for LinkedIn-style following
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT 
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_profile_views_viewed ON public.profile_views(viewed_profile_id);
CREATE INDEX idx_profile_views_created ON public.profile_views(created_at);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_views
CREATE POLICY "Users can view their own profile views"
  ON public.profile_views FOR SELECT 
  USING (auth.uid() = viewed_profile_id);

CREATE POLICY "Anyone can create profile views"
  ON public.profile_views FOR INSERT 
  WITH CHECK (true);

-- Add follower/following counts to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;

-- Create function to update follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the user being followed
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE user_id = NEW.following_id;
    
    -- Increment following count for the user who followed
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE user_id = NEW.follower_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count
    UPDATE public.profiles 
    SET followers_count = GREATEST(0, followers_count - 1) 
    WHERE user_id = OLD.following_id;
    
    -- Decrement following count
    UPDATE public.profiles 
    SET following_count = GREATEST(0, following_count - 1) 
    WHERE user_id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for follow counts
DROP TRIGGER IF EXISTS follow_counts_trigger ON public.follows;
CREATE TRIGGER follow_counts_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_follow_counts();