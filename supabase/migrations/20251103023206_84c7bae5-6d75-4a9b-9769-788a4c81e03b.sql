-- Update old meeting links to use Whereby format
-- This updates sessions with old daily.co or jitsi links, or NULL links
UPDATE mentoring_sessions
SET meeting_link = 'https://startup-platform.whereby.com/session-' || id
WHERE status = 'scheduled'
  AND scheduled_at > NOW()
  AND (
    meeting_link LIKE '%daily.co%'
    OR meeting_link LIKE '%jitsi%'
    OR meeting_link IS NULL
  );