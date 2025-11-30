-- Enable REPLICA IDENTITY FULL for complete row data in realtime updates
ALTER TABLE public.mentorship_relationships REPLICA IDENTITY FULL;

-- Add mentorship_relationships to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_relationships;