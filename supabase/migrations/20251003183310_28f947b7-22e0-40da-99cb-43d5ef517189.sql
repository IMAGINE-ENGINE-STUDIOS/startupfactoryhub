-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  organizer_id UUID NOT NULL,
  is_public BOOLEAN DEFAULT true,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view public events"
ON public.events
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can view their own events"
ON public.events
FOR SELECT
USING (auth.uid() = organizer_id);

CREATE POLICY "Users can create events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events"
ON public.events
FOR UPDATE
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their events"
ON public.events
FOR DELETE
USING (auth.uid() = organizer_id);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_attendees
CREATE POLICY "Anyone can view event attendees"
ON public.event_attendees
FOR SELECT
USING (true);

CREATE POLICY "Users can manage their attendance"
ON public.event_attendees
FOR ALL
USING (auth.uid() = user_id);

-- Create event_invites table
CREATE TABLE IF NOT EXISTS public.event_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, invitee_id)
);

-- Enable RLS on event_invites
ALTER TABLE public.event_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_invites
CREATE POLICY "Users can view their invites"
ON public.event_invites
FOR SELECT
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Users can create invites for events"
ON public.event_invites
FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update their invite status"
ON public.event_invites
FOR UPDATE
USING (auth.uid() = invitee_id);

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_attendees_updated_at
BEFORE UPDATE ON public.event_attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event banners
CREATE POLICY "Anyone can view event banners"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-banners');

CREATE POLICY "Authenticated users can upload event banners"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-banners' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their event banners"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their event banners"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-banners' AND
  auth.uid()::text = (storage.foldername(name))[1]
);