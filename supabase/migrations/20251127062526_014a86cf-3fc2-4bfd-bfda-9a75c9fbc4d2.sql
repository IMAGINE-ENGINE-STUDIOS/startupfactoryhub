-- Add foreign key relationships to profiles table for new study room tables only
ALTER TABLE public.study_group_messages 
  ADD CONSTRAINT study_group_messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.study_group_files 
  ADD CONSTRAINT study_group_files_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;