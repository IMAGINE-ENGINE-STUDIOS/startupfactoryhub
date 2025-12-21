-- Create live_rooms table
CREATE TABLE public.live_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  meeting_link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create live_room_participants table
CREATE TABLE public.live_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_room_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_rooms
CREATE POLICY "Anyone can view active rooms"
ON public.live_rooms FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can create rooms"
ON public.live_rooms FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their rooms"
ON public.live_rooms FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their rooms"
ON public.live_rooms FOR DELETE
USING (auth.uid() = creator_id);

-- RLS policies for live_room_participants
CREATE POLICY "Anyone can view room participants"
ON public.live_room_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join rooms"
ON public.live_room_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.live_room_participants FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for participant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_room_participants;