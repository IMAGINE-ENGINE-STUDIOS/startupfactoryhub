-- Extend expiry on all pending official mentor invitations so invitees can complete signup
UPDATE public.official_mentor_invitations
SET expires_at = now() + interval '60 days'
WHERE status = 'pending'
  AND expires_at < now() + interval '7 days';