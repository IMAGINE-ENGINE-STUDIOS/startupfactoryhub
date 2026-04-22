ALTER TABLE public.official_mentor_invitations
ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0;