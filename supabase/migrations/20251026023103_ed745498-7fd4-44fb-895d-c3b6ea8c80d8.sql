-- Add foreign key constraints to link new tables with profiles

ALTER TABLE pdf_comments
  ADD CONSTRAINT pdf_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE pdf_comment_replies
  ADD CONSTRAINT pdf_comment_replies_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE pdf_activities
  ADD CONSTRAINT pdf_activities_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE pdf_versions
  ADD CONSTRAINT pdf_versions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE pdf_notifications
  ADD CONSTRAINT pdf_notifications_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;