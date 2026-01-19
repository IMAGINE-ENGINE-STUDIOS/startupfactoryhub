-- Create table for external event registrations (non-platform users)
CREATE TABLE public.event_external_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, email)
);

-- Enable RLS
ALTER TABLE public.event_external_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public registration)
CREATE POLICY "Anyone can register for public events"
ON public.event_external_registrations
FOR INSERT
WITH CHECK (true);

-- Allow anyone to view their own registration by email (for confirmation pages)
CREATE POLICY "Anyone can view registrations"
ON public.event_external_registrations
FOR SELECT
USING (true);

-- Allow event organizers to manage registrations
CREATE POLICY "Event organizers can update registrations"
ON public.event_external_registrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_external_registrations.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Allow event organizers to delete registrations
CREATE POLICY "Event organizers can delete registrations"
ON public.event_external_registrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_external_registrations.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_event_external_registrations_event_id ON public.event_external_registrations(event_id);
CREATE INDEX idx_event_external_registrations_email ON public.event_external_registrations(email);