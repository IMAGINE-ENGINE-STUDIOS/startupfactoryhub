-- Clean up orphaned records in study_group_members and add foreign key to profiles
-- First, delete any study_group_members records that don't have matching profiles
DELETE FROM public.study_group_members
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Now add the foreign key constraint
ALTER TABLE public.study_group_members 
  ADD CONSTRAINT study_group_members_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;