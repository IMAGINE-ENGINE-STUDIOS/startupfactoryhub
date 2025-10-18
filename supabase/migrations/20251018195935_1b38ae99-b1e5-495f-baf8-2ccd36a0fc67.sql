-- Add 'short' to post_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'post_type' AND e.enumlabel = 'short'
  ) THEN
    ALTER TYPE post_type ADD VALUE 'short';
  END IF;
END $$;

-- Ensure RLS policies support all post types
DROP POLICY IF EXISTS "Anyone can view posts" ON public.feed_posts;
CREATE POLICY "Anyone can view posts" ON public.feed_posts
  FOR SELECT USING (true);