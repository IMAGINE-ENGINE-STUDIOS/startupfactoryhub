-- Notification email repair (applied live in the Supabase dashboard 2026-11-19).
-- Root cause: public.profiles is a privacy VIEW whose email column is always
-- NULL; the real addresses live in public.profiles_data (312/312 populated,
-- written at signup by handle_new_user). Every notify_* function below read
-- the recipient email from the view, so its email branch could never fire
-- (and notify_cohort_status_change's recipient loop never ran at all).
-- Fix: each function's recipient-email lookup now reads profiles_data.
-- Name/avatar lookups for the other party stay on the view, unchanged.
-- Deliberately untouched: notify_post_interaction (its email send is
-- commented out by design, "to avoid email spam during testing"),
-- net_group_notify_invite / notify_calendar_booking_created /
-- notify_calendar_booking_status (in-app notifications only, no email),
-- and notify_event_registration (fixed separately the same day, resolving
-- email from auth.users; migration 20261119173000).

CREATE OR REPLACE FUNCTION public.notify_application_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  job_title text;
  applicant_email text;
  applicant_name text;
  company_name text;
  company_logo text;
BEGIN
  IF NEW.status != OLD.status THEN
    SELECT j.title, c.name, c.logo_url INTO job_title, company_name, company_logo
    FROM jobs j JOIN companies c ON j.company_id = c.id
    WHERE j.id = NEW.job_id;
    
    SELECT email, COALESCE(full_name, email) INTO applicant_email, applicant_name
    FROM profiles_data WHERE user_id = NEW.user_id;
    
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
        company_name, company_logo, 'company', applicant_name
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_email text;
  v_user_name text;
  v_status_label text;
  v_status_type text;
  v_status_emoji text;
  v_date_str text;
  v_time_str text;
  v_email_body text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT email, COALESCE(full_name, email) INTO v_user_email, v_user_name
  FROM profiles_data WHERE user_id = NEW.user_id;

  v_status_label := CASE NEW.status
    WHEN 'pending' THEN 'Pending Review'
    WHEN 'confirmed' THEN 'Active / Confirmed'
    WHEN 'needs_action' THEN 'Updating - Action Needed'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE NEW.status
  END;

  v_status_type := CASE NEW.status
    WHEN 'confirmed' THEN 'success'
    WHEN 'needs_action' THEN 'warning'
    WHEN 'cancelled' THEN 'error'
    ELSE 'info'
  END;

  v_status_emoji := CASE NEW.status
    WHEN 'pending' THEN 'Booking'
    WHEN 'confirmed' THEN 'Approved'
    WHEN 'needs_action' THEN 'Update'
    WHEN 'cancelled' THEN 'Cancelled'
    ELSE 'Booking'
  END;

  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    v_status_emoji || ': ' || v_status_label,
    'Your workspace booking at ' || NEW.venue_name || ' has been updated to: ' || v_status_label ||
    CASE WHEN NEW.admin_notes IS NOT NULL THEN '. Note: ' || NEW.admin_notes ELSE '' END,
    v_status_type
  );

  IF v_user_email IS NOT NULL THEN
    v_date_str := to_char(NEW.from_datetime AT TIME ZONE 'UTC', 'Day, DD Month YYYY');
    v_time_str := to_char(NEW.from_datetime AT TIME ZONE 'UTC', 'HH12:MI AM') || ' - ' || to_char(NEW.to_datetime AT TIME ZONE 'UTC', 'HH12:MI AM') || ' UTC';

    v_email_body := 'Hi ' || v_user_name || '! Your booking at <strong>' || NEW.venue_name || '</strong> has been updated.<br><br>' ||
      'Status: <strong>' || v_status_label || '</strong><br>' ||
      'Date: ' || v_date_str || '<br>' ||
      'Time: ' || v_time_str || '<br>';

    IF NEW.admin_notes IS NOT NULL THEN
      v_email_body := v_email_body || '<br>Admin Note: ' || NEW.admin_notes;
    END IF;

    v_email_body := v_email_body || '<br><br>Log in to view your booking details.';

    PERFORM send_notification_email(
      v_user_email,
      'Workspace Booking ' || v_status_label,
      v_email_body,
      v_status_type,
      'Startup Factory Hub', NULL, 'platform', v_user_name
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_cohort_acceptance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_owner_id uuid;
  v_company_owner_email text;
  v_company_owner_name text;
  v_company_name text;
  v_cohort_name text;
  v_accelerator_name text;
  v_accelerator_logo text;
BEGIN
  SELECT c.user_id, c.name INTO v_company_owner_id, v_company_name
  FROM companies c WHERE c.id = NEW.company_id;

  IF v_company_owner_id IS NULL THEN RETURN NEW; END IF;

  SELECT p.email, COALESCE(p.full_name, p.email) INTO v_company_owner_email, v_company_owner_name
  FROM profiles_data p WHERE p.user_id = v_company_owner_id;

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
      v_accelerator_name, v_accelerator_logo, 'accelerator', v_company_owner_name
    );
  END IF;

  RETURN NEW;
END;
$function$;

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
  v_recipient_name text;
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

  SELECT ap.organization_name, ap.logo_url INTO v_accelerator_name, v_accelerator_logo
  FROM accelerator_profiles ap
  WHERE ap.id = NEW.accelerator_id;

  FOR v_rec IN
    SELECT c.user_id, p.email, c.name AS company_name, COALESCE(p.full_name, p.email) AS owner_name
    FROM cohort_startups cs
    JOIN companies c ON c.id = cs.company_id
    JOIN profiles_data p ON p.user_id = c.user_id
    WHERE cs.cohort_id = NEW.id AND c.user_id IS NOT NULL AND p.email IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (v_rec.user_id, v_status_label || ': ' || NEW.name,
      'The cohort "' || NEW.name || '" has a status update: ' || v_status_label, v_status_type);

    PERFORM send_notification_email(
      v_rec.email, v_status_label || ': ' || NEW.name,
      'Hi ' || v_rec.owner_name || '! The cohort "' || NEW.name || '" status has changed to: ' || v_status_label || '. Log in to the platform for more details.',
      v_status_type,
      v_accelerator_name, v_accelerator_logo, 'accelerator', v_rec.owner_name
    );
  END LOOP;

  RETURN NEW;
END;
$function$;
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
  requester_name text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    SELECT COALESCE(full_name, email), avatar_url INTO acceptor_name, acceptor_avatar
    FROM profiles WHERE user_id = NEW.addressee_id;
    
    SELECT email, COALESCE(full_name, email) INTO requester_email, requester_name
    FROM profiles_data WHERE user_id = NEW.requester_id;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.requester_id, 'Connection Accepted', acceptor_name || ' accepted your connection request', 'success');
    
    IF requester_email IS NOT NULL THEN
      PERFORM send_notification_email(
        requester_email, 'Connection Accepted',
        acceptor_name || ' accepted your connection request', 'success',
        acceptor_name, acceptor_avatar, NULL, requester_name
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_event_invite()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_event_title text;
  v_event_date text;
  v_event_time text;
  v_event_location text;
  v_event_url text;
  v_inviter_name text;
  v_inviter_avatar text;
  v_invitee_email text;
  v_invitee_name text;
BEGIN
  SELECT title,
         COALESCE(to_char(start_date AT TIME ZONE 'America/New_York', 'FMDay, FMMonth DD, YYYY'), 'TBD'),
         COALESCE(to_char(start_date AT TIME ZONE 'America/New_York', 'HH12:MI AM') || ' ET', ''),
         COALESCE(location, 'Online')
  INTO v_event_title, v_event_date, v_event_time, v_event_location
  FROM events WHERE id = NEW.event_id;

  v_event_url := 'https://startupfactoryhub.com/events/' || NEW.event_id;

  SELECT COALESCE(full_name, email), avatar_url
  INTO v_inviter_name, v_inviter_avatar
  FROM profiles WHERE user_id = NEW.inviter_id;

  SELECT email, COALESCE(full_name, email)
  INTO v_invitee_email, v_invitee_name
  FROM profiles_data WHERE user_id = NEW.invitee_id;

  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.invitee_id,
    'Event Invitation',
    v_inviter_name || ' invited you to "' || v_event_title || '" on ' || v_event_date,
    'event'
  );

  IF v_invitee_email IS NOT NULL THEN
    PERFORM send_notification_email(
      v_invitee_email,
      'You''re Invited: ' || v_event_title,
      '<p style="margin:0 0 16px 0;"><strong>' || v_inviter_name || '</strong> has invited you to attend <strong>' || v_event_title || '</strong>.</p>'
      || '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 16px 0;">'
      || '<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#9ca3af;font-size:13px;width:90px;">Date</td>'
      || '<td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#f3f4f6;font-size:14px;font-weight:600;">' || v_event_date || '</td></tr>'
      || '<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#9ca3af;font-size:13px;">Time</td>'
      || '<td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#f3f4f6;font-size:14px;font-weight:600;">' || v_event_time || '</td></tr>'
      || '<tr><td style="padding:10px 0;color:#9ca3af;font-size:13px;">Location</td>'
      || '<td style="padding:10px 0;color:#f3f4f6;font-size:14px;font-weight:600;">' || v_event_location || '</td></tr>'
      || '</table>'
      || '<p style="margin:0;">View the full event details and confirm your spot:</p>'
      || '<p style="margin:16px 0 0 0;"><a href="' || v_event_url || '" style="color:#34d399;">' || v_event_url || '</a></p>',
      'event',
      v_inviter_name,
      v_inviter_avatar,
      NULL,
      v_invitee_name
    );
  END IF;

  RETURN NEW;
END;
$function$;

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
  company_owner_name text;
  applicant_name text;
  applicant_avatar text;
BEGIN
  SELECT j.title, c.user_id INTO job_title, company_owner_id
  FROM jobs j JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;
  
  SELECT email, COALESCE(full_name, email) INTO company_owner_email, company_owner_name
  FROM profiles_data WHERE user_id = company_owner_id;
  
  SELECT COALESCE(full_name, email), avatar_url INTO applicant_name, applicant_avatar
  FROM profiles WHERE user_id = NEW.user_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (company_owner_id, 'New Job Application', applicant_name || ' applied for ' || job_title, 'info');
  
  IF company_owner_email IS NOT NULL THEN
    PERFORM send_notification_email(
      company_owner_email, 'New Job Application',
      applicant_name || ' applied for ' || job_title, 'info',
      applicant_name, applicant_avatar, NULL, company_owner_name
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

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
  mentor_name text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT COALESCE(full_name, email), avatar_url INTO mentee_name, mentee_avatar
    FROM profiles WHERE user_id = NEW.mentee_id;
    
    SELECT email, COALESCE(full_name, email) INTO mentor_email, mentor_name
    FROM profiles_data WHERE user_id = NEW.mentor_id;
    
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.mentor_id, 'New Mentorship Request', mentee_name || ' has requested mentorship', 'info');
    
    IF mentor_email IS NOT NULL THEN
      PERFORM send_notification_email(
        mentor_email, 'New Mentorship Request',
        mentee_name || ' has requested mentorship from you', 'info',
        mentee_name, mentee_avatar, 'mentee', mentor_name
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
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
  addressee_name text;
BEGIN
  SELECT COALESCE(full_name, email), avatar_url INTO requester_name, requester_avatar
  FROM profiles WHERE user_id = NEW.requester_id;
  
  SELECT email, COALESCE(full_name, email) INTO addressee_email, addressee_name
  FROM profiles_data WHERE user_id = NEW.addressee_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (NEW.addressee_id, 'New Connection Request', requester_name || ' wants to connect with you', 'connection');
  
  IF addressee_email IS NOT NULL THEN
    PERFORM send_notification_email(
      addressee_email, 'New Connection Request',
      requester_name || ' wants to connect with you on the platform', 'connection',
      requester_name, requester_avatar, NULL, addressee_name
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

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
  receiver_name text;
BEGIN
  SELECT COALESCE(full_name, email), avatar_url INTO sender_name, sender_avatar
  FROM profiles WHERE user_id = NEW.sender_id;
  
  SELECT email, COALESCE(full_name, email) INTO receiver_email, receiver_name
  FROM profiles_data WHERE user_id = NEW.receiver_id;
  
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (NEW.receiver_id, 'New Message', sender_name || ' sent you a message', 'message');
  
  IF receiver_email IS NOT NULL THEN
    PERFORM send_notification_email(
      receiver_email, 'New Message',
      sender_name || ' sent you a message on the platform', 'message',
      sender_name, sender_avatar, NULL, receiver_name
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_team_join_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_name   TEXT;
  v_company_logo   TEXT;
  v_owner_id       UUID;
  v_owner_email    TEXT;
  v_owner_name     TEXT;
  v_requester_name TEXT;
  v_requester_avatar TEXT;
BEGIN
  SELECT c.name, c.logo_url, c.user_id
    INTO v_company_name, v_company_logo, v_owner_id
  FROM public.companies c
  WHERE c.id = NEW.company_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email, COALESCE(full_name, email)
    INTO v_owner_email, v_owner_name
  FROM public.profiles_data
  WHERE user_id = v_owner_id;

  SELECT COALESCE(full_name, email), avatar_url
    INTO v_requester_name, v_requester_avatar
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_owner_id,
    'New team join request',
    COALESCE(v_requester_name, 'Someone') || ' wants to join the team at ' || COALESCE(v_company_name, 'your startup')
      || COALESCE(' as ' || NEW.title, ''),
    'info'
  );

  IF v_owner_email IS NOT NULL THEN
    PERFORM public.send_notification_email(
      v_owner_email,
      'New team join request',
      COALESCE(v_requester_name, 'A user') || ' has requested to join your team at <strong>'
        || COALESCE(v_company_name, 'your startup') || '</strong>'
        || COALESCE(' as <strong>' || NEW.title || '</strong>', '')
        || '. Log in to your dashboard to approve or reject the request.',
      'info',
      v_requester_name, v_requester_avatar, 'member', v_owner_name
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_team_request_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_name TEXT;
  v_company_logo TEXT;
  v_member_email TEXT;
  v_member_name  TEXT;
  v_label        TEXT;
  v_type         TEXT;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT c.name, c.logo_url INTO v_company_name, v_company_logo
  FROM public.companies c WHERE c.id = NEW.company_id;

  SELECT email, COALESCE(full_name, email)
    INTO v_member_email, v_member_name
  FROM public.profiles_data WHERE user_id = NEW.user_id;

  IF NEW.status = 'approved' THEN
    v_label := 'You joined the team at ' || COALESCE(v_company_name, 'a startup');
    v_type  := 'success';
  ELSE
    v_label := 'Your request to join ' || COALESCE(v_company_name, 'the team') || ' was declined';
    v_type  := 'error';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.user_id, v_label, v_label, v_type);

  IF v_member_email IS NOT NULL THEN
    PERFORM public.send_notification_email(
      v_member_email,
      v_label,
      v_label || '. Log in to view the team page.',
      v_type,
      COALESCE(v_company_name, 'Startup Factory Hub'),
      v_company_logo,
      'company',
      v_member_name
    );
  END IF;

  RETURN NEW;
END;
$function$;
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
  FROM profiles_data p WHERE p.user_id = NEW.mentor_id;

  SELECT p.email, COALESCE(p.full_name, p.email), p.avatar_url
  INTO v_mentee_email, v_mentee_name, v_mentee_avatar
  FROM profiles_data p WHERE p.user_id = NEW.mentee_id;

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
      v_mentee_name, v_mentee_avatar, 'mentee', v_mentor_name
    );
  END IF;

  IF v_mentee_email IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.mentee_id, '✅ Session Confirmed', 'Your session with ' || v_mentor_name || ' is booked for ' || v_session_date, 'success');

    PERFORM send_notification_email(
      v_mentee_email, '✅ Mentoring Session Confirmed',
      'Your mentoring session with ' || v_mentor_name || ' has been booked for ' || v_session_date || '. See you there!', 'success',
      v_mentor_name, v_mentor_avatar, 'mentor', v_mentee_name
    );
  END IF;

  RETURN NEW;
END;
$function$;
