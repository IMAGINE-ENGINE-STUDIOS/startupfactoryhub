-- Drop the existing check constraint
ALTER TABLE public.pitch_meetings 
DROP CONSTRAINT IF EXISTS pitch_meetings_status_check;

-- Add new check constraint with 'pending' included
ALTER TABLE public.pitch_meetings 
ADD CONSTRAINT pitch_meetings_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text, 'rescheduled'::text]));