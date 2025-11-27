-- Add support for comment likes and replies

-- Add parent_comment_id for threaded replies and likes_count to post_comments
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Create index for better query performance on replies (skip if exists)
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_comment_id);

-- Create comment_likes table to track who liked which comments
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON public.comment_likes;

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.comment_likes
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON public.comment_likes
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Create function to update comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON public.comment_likes;

-- Create trigger for updating likes count
CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_likes_count();