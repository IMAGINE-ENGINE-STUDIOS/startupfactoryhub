-- Add outcome column to pitch_meetings table for tracking past pitch results
ALTER TABLE pitch_meetings 
ADD COLUMN outcome text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pitch_meetings.outcome IS 'Outcome of past pitch meetings: follow_up, maybe, not_interested, committed, passed';