-- Add expires_at column to live_rooms with 12-hour default
ALTER TABLE public.live_rooms 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '12 hours');