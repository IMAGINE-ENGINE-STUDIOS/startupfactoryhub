
-- Delete the incorrect official_mentor_status row (created for admin instead of Khalia)
DELETE FROM public.official_mentor_status WHERE user_id = 'fcc1956e-8302-4348-91da-3014dd5069dc' AND invitation_id = '0cd8c622-fe42-43f5-99ca-57bf84a7b41f';

-- Reset the invitation back to pending so Khalia can accept it
UPDATE public.official_mentor_invitations 
SET status = 'pending', accepted_at = NULL, accepted_by = NULL 
WHERE id = '0cd8c622-fe42-43f5-99ca-57bf84a7b41f';
