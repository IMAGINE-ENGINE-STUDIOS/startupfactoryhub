-- Fix notify_post_interaction function to use correct column name
CREATE OR REPLACE FUNCTION public.notify_post_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  post_author_id uuid;
  post_author_email text;
  interactor_name text;
  notification_message text;
BEGIN
  -- Get post author - FIX: use user_id instead of author_id
  SELECT user_id INTO post_author_id
  FROM feed_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user interacting with own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get interactor name
  SELECT COALESCE(full_name, email) INTO interactor_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Get post author email
  SELECT email INTO post_author_email
  FROM profiles
  WHERE user_id = post_author_id;
  
  -- Determine notification message based on table
  IF TG_TABLE_NAME = 'post_likes' THEN
    notification_message := interactor_name || ' liked your post';
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    notification_message := interactor_name || ' commented on your post';
  ELSIF TG_TABLE_NAME = 'post_bookmarks' THEN
    notification_message := interactor_name || ' bookmarked your post';
  END IF;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    post_author_id,
    'Post Interaction',
    notification_message,
    'info'
  );
  
  -- Send email (commented out to avoid email spam during testing)
  -- IF post_author_email IS NOT NULL THEN
  --   PERFORM send_notification_email(
  --     post_author_email,
  --     'Post Interaction',
  --     notification_message,
  --     'info'
  --   );
  -- END IF;
  
  RETURN NEW;
END;
$function$;