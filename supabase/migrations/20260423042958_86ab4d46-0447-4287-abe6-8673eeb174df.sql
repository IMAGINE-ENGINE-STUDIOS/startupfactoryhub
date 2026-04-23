
-- Create meeting_transcripts table to store transcripts and recordings for any meeting type
CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('mentoring_session', 'pitch_meeting', 'calendar_booking', 'hub_booking', 'event', 'other')),
  host_id UUID NOT NULL,
  participant_ids UUID[] DEFAULT '{}'::uuid[],
  title TEXT,
  transcript_text TEXT,
  summary_text TEXT,
  language TEXT DEFAULT 'en',
  recording_url TEXT,
  duration_seconds INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting ON public.meeting_transcripts(meeting_id, meeting_type);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_host ON public.meeting_transcripts(host_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_participants ON public.meeting_transcripts USING GIN (participant_ids);

ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Host or any participant can view
CREATE POLICY "Hosts and participants can view transcripts"
ON public.meeting_transcripts
FOR SELECT
TO authenticated
USING (
  auth.uid() = host_id
  OR auth.uid() = ANY(participant_ids)
);

-- Host can create (or system/edge functions)
CREATE POLICY "Host can create transcripts"
ON public.meeting_transcripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

-- Host can update their transcripts
CREATE POLICY "Host can update transcripts"
ON public.meeting_transcripts
FOR UPDATE
TO authenticated
USING (auth.uid() = host_id);

-- Host can delete their transcripts
CREATE POLICY "Host can delete transcripts"
ON public.meeting_transcripts
FOR DELETE
TO authenticated
USING (auth.uid() = host_id);

CREATE TRIGGER update_meeting_transcripts_updated_at
BEFORE UPDATE ON public.meeting_transcripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
