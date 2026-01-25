-- Add persistent room URL column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS meeting_room_url TEXT;

COMMENT ON COLUMN public.events.meeting_room_url IS 'Persistent Whereby room URL for virtual events (10-year expiration)';