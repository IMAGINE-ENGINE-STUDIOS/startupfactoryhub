-- Create blog_posts table for community blog
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT must_have_author CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT comment_must_have_author CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- Create blog_likes table
CREATE TABLE public.blog_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT like_must_have_identifier CHECK (user_id IS NOT NULL OR guest_identifier IS NOT NULL),
  CONSTRAINT unique_user_like UNIQUE (post_id, user_id),
  CONSTRAINT unique_guest_like UNIQUE (post_id, guest_identifier)
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Blog posts policies (public read, anyone can create)
CREATE POLICY "Anyone can view blog posts"
ON public.blog_posts FOR SELECT
USING (true);

CREATE POLICY "Anyone can create blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own posts"
ON public.blog_posts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.blog_posts FOR UPDATE
USING (auth.uid() = user_id);

-- Blog comments policies
CREATE POLICY "Anyone can view blog comments"
ON public.blog_comments FOR SELECT
USING (true);

CREATE POLICY "Anyone can create blog comments"
ON public.blog_comments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own comments"
ON public.blog_comments FOR DELETE
USING (auth.uid() = user_id);

-- Blog likes policies
CREATE POLICY "Anyone can view blog likes"
ON public.blog_likes FOR SELECT
USING (true);

CREATE POLICY "Anyone can create blog likes"
ON public.blog_likes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can remove their own likes"
ON public.blog_likes FOR DELETE
USING (auth.uid() = user_id OR guest_identifier IS NOT NULL);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_blog_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_blog_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER update_blog_likes_count
AFTER INSERT OR DELETE ON public.blog_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_post_likes_count();

CREATE TRIGGER update_blog_comments_count
AFTER INSERT OR DELETE ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_post_comments_count();