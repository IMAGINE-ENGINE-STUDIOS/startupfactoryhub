-- Create triggers for feed post engagement counts (only if they don't exist)
-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.post_likes;
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.post_comments;
DROP TRIGGER IF EXISTS update_post_bookmarks_count_trigger ON public.post_bookmarks;
DROP TRIGGER IF EXISTS update_post_shares_count_trigger ON public.feed_posts;
DROP TRIGGER IF EXISTS update_feed_posts_updated_at ON public.feed_posts;
DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;

-- Trigger for updating post likes count
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger for updating post comments count
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger for updating post bookmarks count
CREATE TRIGGER update_post_bookmarks_count_trigger
AFTER INSERT OR DELETE ON public.post_bookmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_post_bookmarks_count();

-- Trigger for updating post shares count (when a post is shared as a new post)
CREATE TRIGGER update_post_shares_count_trigger
AFTER INSERT ON public.feed_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_post_shares_count();

-- Trigger for automatically updating the updated_at timestamp on feed_posts
CREATE TRIGGER update_feed_posts_updated_at
BEFORE UPDATE ON public.feed_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for automatically updating the updated_at timestamp on post_comments
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance on feed queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_id ON public.feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_shared_post_id ON public.feed_posts(shared_post_id) WHERE shared_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON public.post_bookmarks(user_id, created_at DESC);

-- Add composite unique indexes for preventing duplicate likes/bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_likes_unique ON public.post_likes(user_id, post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_post_bookmarks_unique ON public.post_bookmarks(user_id, post_id);

-- Update RLS policies for post_bookmarks to support both user-specific and public views
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.post_bookmarks;
DROP POLICY IF EXISTS "Anyone can view bookmark existence for posts" ON public.post_bookmarks;

-- Policy allowing users to see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.post_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Policy allowing anyone to check if posts are bookmarked (for displaying bookmark counts)
CREATE POLICY "Anyone can view bookmark counts"
ON public.post_bookmarks
FOR SELECT
USING (true);

-- Add documentation comments
COMMENT ON TABLE public.feed_posts IS 'Main feed posts table supporting updates, internships, and shared content';
COMMENT ON TABLE public.post_likes IS 'Tracks user likes on feed posts with automatic count updates';
COMMENT ON TABLE public.post_comments IS 'Stores comments on feed posts with automatic count updates';
COMMENT ON TABLE public.post_bookmarks IS 'Tracks user bookmarks/saved posts with automatic count updates';

COMMENT ON COLUMN public.feed_posts.post_type IS 'Type of post: update, internship, or share';
COMMENT ON COLUMN public.feed_posts.shared_post_id IS 'Reference to original post if this is a share';
COMMENT ON COLUMN public.feed_posts.internship_data IS 'JSON data for internship posts';
COMMENT ON COLUMN public.feed_posts.media_urls IS 'Array of media URLs attached to post';
COMMENT ON COLUMN public.feed_posts.likes_count IS 'Automatically updated by trigger';
COMMENT ON COLUMN public.feed_posts.comments_count IS 'Automatically updated by trigger';
COMMENT ON COLUMN public.feed_posts.bookmarks_count IS 'Automatically updated by trigger';
COMMENT ON COLUMN public.feed_posts.shares_count IS 'Automatically updated by trigger';