-- Add host_id columns to track meeting hosts
ALTER TABLE events ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);
UPDATE events SET host_id = organizer_id WHERE host_id IS NULL;

ALTER TABLE mentoring_sessions ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);
UPDATE mentoring_sessions SET host_id = mentor_id WHERE host_id IS NULL;

ALTER TABLE pitch_meetings ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);
UPDATE pitch_meetings SET host_id = startup_id WHERE host_id IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_host_id ON mentoring_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_pitch_meetings_host_id ON pitch_meetings(host_id);