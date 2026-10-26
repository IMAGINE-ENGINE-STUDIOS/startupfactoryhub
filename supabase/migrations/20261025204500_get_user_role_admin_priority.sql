-- Fix (founder report 2026-10-25): get_user_role returned the user's
-- EARLIEST role (ORDER BY created_at ASC LIMIT 1), so any admin who
-- held another role first (e.g. accelerator) was reported as that role
-- everywhere useUserRole() gates on 'admin' — the Matrix Proposals page
-- (Invoice.tsx) showed "Restricted" to both admin accounts.
-- Return the HIGHEST-priority role instead, admin first.
-- Applied live via the Supabase dashboard SQL editor on 2026-10-25;
-- this file records the change in the repo.
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 0
    WHEN 'accelerator' THEN 1
    WHEN 'investor' THEN 2
    WHEN 'advisor' THEN 3
    WHEN 'mentor' THEN 4
    WHEN 'startup' THEN 5
    WHEN 'student' THEN 6
    WHEN 'member' THEN 7
    ELSE 8 END,
    created_at ASC
  LIMIT 1
$$;
