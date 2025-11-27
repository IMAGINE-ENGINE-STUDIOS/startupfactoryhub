-- Fix Study Rooms: Remove ALL existing foreign keys and add correct ones to auth.users
-- Also make storage bucket public

-- Remove ALL existing foreign key constraints (both old and new)
ALTER TABLE public.study_group_members DROP CONSTRAINT IF EXISTS study_group_members_user_id_profiles_fkey;
ALTER TABLE public.study_group_members DROP CONSTRAINT IF EXISTS study_group_members_user_id_fkey;

ALTER TABLE public.study_group_messages DROP CONSTRAINT IF EXISTS study_group_messages_user_id_profiles_fkey;
ALTER TABLE public.study_group_messages DROP CONSTRAINT IF EXISTS study_group_messages_user_id_fkey;

ALTER TABLE public.study_group_files DROP CONSTRAINT IF EXISTS study_group_files_user_id_profiles_fkey;
ALTER TABLE public.study_group_files DROP CONSTRAINT IF EXISTS study_group_files_user_id_fkey;

-- Now add the correct foreign keys to auth.users
ALTER TABLE public.study_group_members 
  ADD CONSTRAINT study_group_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.study_group_messages 
  ADD CONSTRAINT study_group_messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.study_group_files 
  ADD CONSTRAINT study_group_files_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make the study-room-files storage bucket public so file downloads work
UPDATE storage.buckets 
SET public = true 
WHERE id = 'study-room-files';