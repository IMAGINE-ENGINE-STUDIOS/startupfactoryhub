-- Enable REPLICA IDENTITY FULL for complete row data in realtime updates
ALTER TABLE public.mentoring_sessions REPLICA IDENTITY FULL;

-- Add mentoring_sessions to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentoring_sessions;