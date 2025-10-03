-- Add post bookmarks/saves table
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on post_bookmarks
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.post_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks"
ON public.post_bookmarks
FOR ALL
USING (auth.uid() = user_id);

-- Add shared_post_id to feed_posts for reposts/shares
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS shared_post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE;

-- Add likes_count, comments_count, shares_count, bookmarks_count to feed_posts
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0;

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_likes_count_on_like
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_comments_count_on_comment
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Function to update post bookmark count
CREATE OR REPLACE FUNCTION update_post_bookmarks_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts
    SET bookmarks_count = bookmarks_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts
    SET bookmarks_count = GREATEST(0, bookmarks_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_bookmarks_count_on_bookmark
AFTER INSERT OR DELETE ON public.post_bookmarks
FOR EACH ROW
EXECUTE FUNCTION update_post_bookmarks_count();

-- Function to update post shares count
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.shared_post_id IS NOT NULL THEN
    UPDATE public.feed_posts
    SET shares_count = shares_count + 1
    WHERE id = NEW.shared_post_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_shares_count_on_share
AFTER INSERT ON public.feed_posts
FOR EACH ROW
WHEN (NEW.shared_post_id IS NOT NULL)
EXECUTE FUNCTION update_post_shares_count();