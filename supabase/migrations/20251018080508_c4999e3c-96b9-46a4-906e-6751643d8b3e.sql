-- Create function to send notification emails via edge function
CREATE OR REPLACE FUNCTION public.send_notification_email(
  user_email text,
  notification_title text,
  notification_message text,
  notification_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
BEGIN
  -- Construct the edge function URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email';
  
  -- Call edge function in background (non-blocking)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', user_email,
      'title', notification_title,
      'message', notification_message,
      'type', notification_type
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send email notification: %', SQLERRM;
END;
$$;

-- Trigger function for new connections
CREATE OR REPLACE FUNCTION public.notify_new_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name text;
  addressee_email text;
BEGIN
  -- Get requester name
  SELECT COALESCE(full_name, email) INTO requester_name
  FROM profiles
  WHERE user_id = NEW.requester_id;
  
  -- Get addressee email
  SELECT email INTO addressee_email
  FROM profiles
  WHERE user_id = NEW.addressee_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.addressee_id,
    'New Connection Request',
    requester_name || ' wants to connect with you',
    'connection'
  );
  
  -- Send email
  IF addressee_email IS NOT NULL THEN
    PERFORM send_notification_email(
      addressee_email,
      'New Connection Request',
      requester_name || ' wants to connect with you on the platform',
      'connection'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for connection accepted
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acceptor_name text;
  requester_email text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Get acceptor name
    SELECT COALESCE(full_name, email) INTO acceptor_name
    FROM profiles
    WHERE user_id = NEW.addressee_id;
    
    -- Get requester email
    SELECT email INTO requester_email
    FROM profiles
    WHERE user_id = NEW.requester_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.requester_id,
      'Connection Accepted',
      acceptor_name || ' accepted your connection request',
      'success'
    );
    
    -- Send email
    IF requester_email IS NOT NULL THEN
      PERFORM send_notification_email(
        requester_email,
        'Connection Accepted',
        acceptor_name || ' accepted your connection request',
        'success'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  receiver_email text;
BEGIN
  -- Get sender name
  SELECT COALESCE(full_name, email) INTO sender_name
  FROM profiles
  WHERE user_id = NEW.sender_id;
  
  -- Get receiver email
  SELECT email INTO receiver_email
  FROM profiles
  WHERE user_id = NEW.receiver_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.receiver_id,
    'New Message',
    sender_name || ' sent you a message',
    'message'
  );
  
  -- Send email
  IF receiver_email IS NOT NULL THEN
    PERFORM send_notification_email(
      receiver_email,
      'New Message',
      sender_name || ' sent you a message on the platform',
      'message'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for mentorship requests
CREATE OR REPLACE FUNCTION public.notify_mentorship_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentee_name text;
  mentor_email text;
BEGIN
  IF NEW.status = 'pending' THEN
    -- Get mentee name
    SELECT COALESCE(full_name, email) INTO mentee_name
    FROM profiles
    WHERE user_id = NEW.mentee_id;
    
    -- Get mentor email
    SELECT email INTO mentor_email
    FROM profiles
    WHERE user_id = NEW.mentor_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.mentor_id,
      'New Mentorship Request',
      mentee_name || ' has requested mentorship',
      'info'
    );
    
    -- Send email
    IF mentor_email IS NOT NULL THEN
      PERFORM send_notification_email(
        mentor_email,
        'New Mentorship Request',
        mentee_name || ' has requested mentorship from you',
        'info'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for job applications
CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_title text;
  company_owner_id uuid;
  company_owner_email text;
  applicant_name text;
BEGIN
  -- Get job details and company owner
  SELECT j.title, c.user_id INTO job_title, company_owner_id
  FROM jobs j
  JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Get company owner email
  SELECT email INTO company_owner_email
  FROM profiles
  WHERE user_id = company_owner_id;
  
  -- Get applicant name
  SELECT COALESCE(full_name, email) INTO applicant_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification for company owner
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    company_owner_id,
    'New Job Application',
    applicant_name || ' applied for ' || job_title,
    'info'
  );
  
  -- Send email
  IF company_owner_email IS NOT NULL THEN
    PERFORM send_notification_email(
      company_owner_email,
      'New Job Application',
      applicant_name || ' applied for ' || job_title,
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_title text;
  applicant_email text;
BEGIN
  IF NEW.status != OLD.status THEN
    -- Get job title
    SELECT title INTO job_title
    FROM jobs
    WHERE id = NEW.job_id;
    
    -- Get applicant email
    SELECT email INTO applicant_email
    FROM profiles
    WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Application Update',
      'Your application for ' || job_title || ' has been ' || NEW.status,
      CASE NEW.status
        WHEN 'accepted' THEN 'success'
        WHEN 'rejected' THEN 'error'
        ELSE 'info'
      END
    );
    
    -- Send email
    IF applicant_email IS NOT NULL THEN
      PERFORM send_notification_email(
        applicant_email,
        'Application Update',
        'Your application for ' || job_title || ' has been ' || NEW.status,
        CASE NEW.status
          WHEN 'accepted' THEN 'success'
          WHEN 'rejected' THEN 'error'
          ELSE 'info'
        END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for event registrations
CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_title text;
  user_email text;
BEGIN
  -- Get event title
  SELECT title INTO event_title
  FROM events
  WHERE id = NEW.event_id;
  
  -- Get user email
  SELECT email INTO user_email
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Event Registration Confirmed',
    'You are registered for ' || event_title,
    'success'
  );
  
  -- Send email
  IF user_email IS NOT NULL THEN
    PERFORM send_notification_email(
      user_email,
      'Event Registration Confirmed',
      'You have successfully registered for ' || event_title,
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for post interactions (likes, comments)
CREATE OR REPLACE FUNCTION public.notify_post_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id uuid;
  post_author_email text;
  interactor_name text;
  notification_message text;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author_id
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
  
  -- Send email
  IF post_author_email IS NOT NULL THEN
    PERFORM send_notification_email(
      post_author_email,
      'Post Interaction',
      notification_message,
      'info'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_connection ON connections;
CREATE TRIGGER trigger_notify_new_connection
  AFTER INSERT ON connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_connection();

DROP TRIGGER IF EXISTS trigger_notify_connection_accepted ON connections;
CREATE TRIGGER trigger_notify_connection_accepted
  AFTER UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_accepted();

DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

DROP TRIGGER IF EXISTS trigger_notify_mentorship_request ON mentorship_relationships;
CREATE TRIGGER trigger_notify_mentorship_request
  AFTER INSERT ON mentorship_relationships
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentorship_request();

DROP TRIGGER IF EXISTS trigger_notify_job_application ON job_applications;
CREATE TRIGGER trigger_notify_job_application
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_application();

DROP TRIGGER IF EXISTS trigger_notify_application_status ON job_applications;
CREATE TRIGGER trigger_notify_application_status
  AFTER UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status();

DROP TRIGGER IF EXISTS trigger_notify_event_registration ON event_attendees;
CREATE TRIGGER trigger_notify_event_registration
  AFTER INSERT ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_registration();

DROP TRIGGER IF EXISTS trigger_notify_post_like ON post_likes;
CREATE TRIGGER trigger_notify_post_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_interaction();

DROP TRIGGER IF EXISTS trigger_notify_post_comment ON post_comments;
CREATE TRIGGER trigger_notify_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_interaction();