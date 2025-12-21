-- Add is_public column to live_rooms
ALTER TABLE public.live_rooms ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Add room_data column to feed_posts for live room posts
ALTER TABLE public.feed_posts ADD COLUMN room_data jsonb DEFAULT NULL;

-- Update RLS policy for live_rooms to handle public/private visibility
DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.live_rooms;

CREATE POLICY "Users can view public rooms or their own private rooms"
ON public.live_rooms
FOR SELECT
USING (
  is_active = true AND (
    is_public = true OR 
    creator_id = auth.uid()
  )
);