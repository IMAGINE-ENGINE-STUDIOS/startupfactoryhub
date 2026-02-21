
-- 1. Update send_notification_email to accept actor fields
CREATE OR REPLACE FUNCTION public.send_notification_email(
  user_email text,
  notification_title text,
  notification_message text,
  notification_type text,
  actor_name text DEFAULT NULL,
  actor_avatar_url text DEFAULT NULL,
  actor_role text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  function_url text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification-email';
  
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
      'type', notification_type,
      'actorName', actor_name,
      'actorAvatarUrl', actor_avatar_url,
      'actorRole', actor_role
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send email notification: %', SQLERRM;
END;
$function$;

-- 2. notify_new_connection — pass requester avatar
CREATE OR REPLACE FUNCTION public.notify_new_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester_name text;
  requester_avatar text;
  addressee_email text;
BEGIN
  SELECT COALESCE(full_name, email), avatar_url INTO requester_name, requester_avatar
  FROM profiles WHERE user_id = NEW.requester_id;
  
  SELECT email INTO addressee_email FROM profiles WHERE user_id = NEW.addressee_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (NEW.addressee_id, 'New Connection Request', requester_name || ' wants to connect with you', 'connection');
  
  IF addressee_email IS NOT NULL THEN
    PERFORM send_notification_email(
      addressee_email, 'New Connection Request',
      requester_name || ' wants to connect with you on the platform', 'connection',
      requester_name, requester_avatar, NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. notify_connection_accepted — pass acceptor avatar
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  acceptor_name text;
  acceptor_avatar text;
  requester_email text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    SELECT COALESCE(full_name, email), avatar_url INTO acceptor_name, acceptor_avatar
    FROM profiles WHERE user_id = NEW.addressee_id;
    
    SELECT email INTO requester_email FROM profiles WHERE user_id = NEW.requester_id;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.requester_id, 'Connection Accepted', acceptor_name || ' accepted your connection request', 'success');
    
    IF requester_email IS NOT NULL THEN
      PERFORM send_notification_email(
        requester_email, 'Connection Accepted',
        acceptor_name || ' accepted your connection request', 'success',
        acceptor_name, acceptor_avatar, NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. notify_new_message — pass sender avatar
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_name text;
  sender_avatar text;
  receiver_email text;
BEGIN
  SELECT COALESCE(full_name, email), avatar_url INTO sender_name, sender_avatar
  FROM profiles WHERE user_id = NEW.sender_id;
  
  SELECT email INTO receiver_email FROM profiles WHERE user_id = NEW.receiver_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (NEW.receiver_id, 'New Message', sender_name || ' sent you a message', 'message');
  
  IF receiver_email IS NOT NULL THEN
    PERFORM send_notification_email(
      receiver_email, 'New Message',
      sender_name || ' sent you a message on the platform', 'message',
      sender_name, sender_avatar, NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 5. notify_mentorship_request — pass mentee avatar
CREATE OR REPLACE FUNCTION public.notify_mentorship_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mentee_name text;
  mentee_avatar text;
  mentor_email text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT COALESCE(full_name, email), avatar_url INTO mentee_name, mentee_avatar
    FROM profiles WHERE user_id = NEW.mentee_id;
    
    SELECT email INTO mentor_email FROM profiles WHERE user_id = NEW.mentor_id;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.mentor_id, 'New Mentorship Request', mentee_name || ' has requested mentorship', 'info');
    
    IF mentor_email IS NOT NULL THEN
      PERFORM send_notification_email(
        mentor_email, 'New Mentorship Request',
        mentee_name || ' has requested mentorship from you', 'info',
        mentee_name, mentee_avatar, 'mentee'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 6. notify_session_booked — pass avatars for both mentor and mentee
CREATE OR REPLACE FUNCTION public.notify_session_booked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_mentor_email text;
  v_mentee_email text;
  v_mentor_name text;
  v_mentee_name text;
  v_mentor_avatar text;
  v_mentee_avatar text;
  v_session_date text;
BEGIN
  SELECT p.email, COALESCE(p.full_name, p.email), p.avatar_url
  INTO v_mentor_email, v_mentor_name, v_mentor_avatar
  FROM profiles p WHERE p.user_id = NEW.mentor_id;

  SELECT p.email, COALESCE(p.full_name, p.email), p.avatar_url
  INTO v_mentee_email, v_mentee_name, v_mentee_avatar
  FROM profiles p WHERE p.user_id = NEW.mentee_id;

  v_session_date := CASE
    WHEN NEW.scheduled_at IS NOT NULL THEN to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'Day, DD Month YYYY at HH12:MI AM UTC')
    ELSE 'TBD'
  END;

  IF v_mentor_email IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.mentor_id, '📅 New Session Booked', v_mentee_name || ' has booked a mentoring session with you for ' || v_session_date, 'info');

    PERFORM send_notification_email(
      v_mentor_email, '📅 New Mentoring Session Booked',
      v_mentee_name || ' has scheduled a mentoring session with you for ' || v_session_date || '. Please log in to confirm and prepare.', 'info',
      v_mentee_name, v_mentee_avatar, 'mentee'
    );
  END IF;

  IF v_mentee_email IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.mentee_id, '✅ Session Confirmed', 'Your session with ' || v_mentor_name || ' is booked for ' || v_session_date, 'success');

    PERFORM send_notification_email(
      v_mentee_email, '✅ Mentoring Session Confirmed',
      'Your mentoring session with ' || v_mentor_name || ' has been booked for ' || v_session_date || '. See you there!', 'success',
      v_mentor_name, v_mentor_avatar, 'mentor'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. notify_job_application — pass applicant avatar
CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job_title text;
  company_owner_id uuid;
  company_owner_email text;
  applicant_name text;
  applicant_avatar text;
BEGIN
  SELECT j.title, c.user_id INTO job_title, company_owner_id
  FROM jobs j JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  SELECT email INTO company_owner_email FROM profiles WHERE user_id = company_owner_id;
  
  SELECT COALESCE(full_name, email), avatar_url INTO applicant_name, applicant_avatar
  FROM profiles WHERE user_id = NEW.user_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (company_owner_id, 'New Job Application', applicant_name || ' applied for ' || job_title, 'info');
  
  IF company_owner_email IS NOT NULL THEN
    PERFORM send_notification_email(
      company_owner_email, 'New Job Application',
      applicant_name || ' applied for ' || job_title, 'info',
      applicant_name, applicant_avatar, NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. notify_application_status — pass company info (implicit actor)
CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  job_title text;
  applicant_email text;
  company_name text;
  company_logo text;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT j.title, c.name, c.logo_url INTO job_title, company_name, company_logo
    FROM jobs j JOIN companies c ON j.company_id = c.id
    WHERE j.id = NEW.job_id;
    
    SELECT email INTO applicant_email FROM profiles WHERE user_id = NEW.user_id;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id, 'Application Update',
      'Your application for ' || job_title || ' has been ' || NEW.status,
      CASE NEW.status WHEN 'accepted' THEN 'success' WHEN 'rejected' THEN 'error' ELSE 'info' END
    );
    
    IF applicant_email IS NOT NULL THEN
      PERFORM send_notification_email(
        applicant_email, 'Application Update',
        'Your application for ' || job_title || ' has been ' || NEW.status,
        CASE NEW.status WHEN 'accepted' THEN 'success' WHEN 'rejected' THEN 'error' ELSE 'info' END,
        company_name, company_logo, 'company'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 9. notify_event_registration — pass user avatar
CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_title text;
  user_email text;
  user_name text;
  user_avatar text;
BEGIN
  SELECT title INTO event_title FROM events WHERE id = NEW.event_id;
  
  SELECT email, COALESCE(full_name, email), avatar_url INTO user_email, user_name, user_avatar
  FROM profiles WHERE user_id = NEW.user_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (NEW.user_id, 'Event Registration Confirmed', 'You are registered for ' || event_title, 'success');
  
  IF user_email IS NOT NULL THEN
    PERFORM send_notification_email(
      user_email, 'Event Registration Confirmed',
      'You have successfully registered for ' || event_title, 'success',
      user_name, user_avatar, NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 10. notify_cohort_acceptance — pass accelerator info
CREATE OR REPLACE FUNCTION public.notify_cohort_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_owner_id uuid;
  v_company_owner_email text;
  v_company_name text;
  v_cohort_name text;
  v_accelerator_name text;
  v_accelerator_logo text;
BEGIN
  SELECT c.user_id, c.name INTO v_company_owner_id, v_company_name
  FROM companies c WHERE c.id = NEW.company_id;

  IF v_company_owner_id IS NULL THEN RETURN NEW; END IF;

  SELECT p.email INTO v_company_owner_email FROM profiles p WHERE p.user_id = v_company_owner_id;

  SELECT ac.name, ap.organization_name, ap.logo_url
  INTO v_cohort_name, v_accelerator_name, v_accelerator_logo
  FROM accelerator_cohorts ac
  JOIN accelerator_profiles ap ON ap.id = ac.accelerator_id
  WHERE ac.id = NEW.cohort_id;

  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    v_company_owner_id,
    '🎉 Accepted into ' || COALESCE(v_cohort_name, 'Cohort'),
    COALESCE(v_company_name, 'Your startup') || ' has been accepted into ' ||
    COALESCE(v_cohort_name, 'the cohort') || ' at ' || COALESCE(v_accelerator_name, 'Startup Factory Hub') || '!',
    'success'
  );

  IF v_company_owner_email IS NOT NULL THEN
    PERFORM send_notification_email(
      v_company_owner_email,
      '🎉 Congratulations! Accepted into ' || COALESCE(v_cohort_name, 'Cohort'),
      COALESCE(v_company_name, 'Your startup') || ' has been officially accepted into ' ||
      COALESCE(v_cohort_name, 'the cohort') || ' at ' || COALESCE(v_accelerator_name, 'Startup Factory Hub') ||
      '. Welcome to the program! Log in to view your cohort details, resources, and next steps.',
      'success',
      v_accelerator_name, v_accelerator_logo, 'accelerator'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 11. notify_cohort_status_change — pass accelerator info
CREATE OR REPLACE FUNCTION public.notify_cohort_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec RECORD;
  v_status_label text;
  v_status_type text;
  v_accelerator_name text;
  v_accelerator_logo text;
BEGIN
  v_status_label := CASE NEW.status
    WHEN 'applications_open'  THEN '📢 Applications Are Now Open'
    WHEN 'in_progress'        THEN '▶️ Program Has Started'
    WHEN 'completed'          THEN '🎓 Program Completed'
    WHEN 'cancelled'          THEN '❌ Program Cancelled'
    ELSE NEW.status
  END;

  v_status_type := CASE NEW.status
    WHEN 'applications_open' THEN 'info'
    WHEN 'in_progress'       THEN 'success'
    WHEN 'completed'         THEN 'success'
    WHEN 'cancelled'         THEN 'error'
    ELSE 'info'
  END;

  -- Get accelerator info
  SELECT ap.organization_name, ap.logo_url INTO v_accelerator_name, v_accelerator_logo
  FROM accelerator_profiles ap
  WHERE ap.id = NEW.accelerator_id;

  FOR v_rec IN
    SELECT c.user_id, p.email, c.name AS company_name
    FROM cohort_startups cs
    JOIN companies c ON c.id = cs.company_id
    JOIN profiles p ON p.user_id = c.user_id
    WHERE cs.cohort_id = NEW.id AND c.user_id IS NOT NULL AND p.email IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (v_rec.user_id, v_status_label || ': ' || NEW.name,
      'The cohort "' || NEW.name || '" has a status update: ' || v_status_label, v_status_type);

    PERFORM send_notification_email(
      v_rec.email, v_status_label || ': ' || NEW.name,
      'Hi ' || v_rec.company_name || '! The cohort "' || NEW.name || '" status has changed to: ' || v_status_label || '. Log in to the platform for more details.',
      v_status_type,
      v_accelerator_name, v_accelerator_logo, 'accelerator'
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
