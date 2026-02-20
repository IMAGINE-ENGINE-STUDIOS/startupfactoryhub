
-- ============================================================
-- EMAIL TRIGGERS: Cohort Acceptance, Cohort Status Change,
-- Mentoring Session Booked
-- ============================================================

-- 1. COHORT ACCEPTANCE EMAIL
-- Fires when a startup is added to a cohort (cohort_startups INSERT)
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
BEGIN
  -- Get company owner and name
  SELECT c.user_id, c.name
  INTO v_company_owner_id, v_company_name
  FROM public.companies c
  WHERE c.id = NEW.company_id;

  -- Handle manual entry (external company, no platform user)
  IF v_company_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get owner email
  SELECT p.email
  INTO v_company_owner_email
  FROM public.profiles p
  WHERE p.user_id = v_company_owner_id;

  -- Get cohort + accelerator names
  SELECT ac.name, ap.organization_name
  INTO v_cohort_name, v_accelerator_name
  FROM public.accelerator_cohorts ac
  JOIN public.accelerator_profiles ap ON ap.id = ac.accelerator_id
  WHERE ac.id = NEW.cohort_id;

  -- Create in-app notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_company_owner_id,
    '🎉 Accepted into ' || COALESCE(v_cohort_name, 'Cohort'),
    COALESCE(v_company_name, 'Your startup') || ' has been accepted into ' ||
    COALESCE(v_cohort_name, 'the cohort') || ' at ' ||
    COALESCE(v_accelerator_name, 'Startup Factory Hub') || '!',
    'success'
  );

  -- Send email notification
  IF v_company_owner_email IS NOT NULL THEN
    PERFORM public.send_notification_email(
      v_company_owner_email,
      '🎉 Congratulations! Accepted into ' || COALESCE(v_cohort_name, 'Cohort'),
      COALESCE(v_company_name, 'Your startup') || ' has been officially accepted into ' ||
      COALESCE(v_cohort_name, 'the cohort') || ' at ' ||
      COALESCE(v_accelerator_name, 'Startup Factory Hub') ||
      '. Welcome to the program! Log in to view your cohort details, resources, and next steps.',
      'success'
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_cohort_startup_acceptance
AFTER INSERT ON public.cohort_startups
FOR EACH ROW
EXECUTE FUNCTION public.notify_cohort_acceptance();


-- 2. COHORT STATUS CHANGE EMAIL
-- Fires when a cohort's status is updated
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
BEGIN
  -- Determine human-readable status label
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

  -- Notify all startups enrolled in this cohort
  FOR v_rec IN
    SELECT c.user_id, p.email, c.name AS company_name
    FROM public.cohort_startups cs
    JOIN public.companies c ON c.id = cs.company_id
    JOIN public.profiles p ON p.user_id = c.user_id
    WHERE cs.cohort_id = NEW.id
      AND c.user_id IS NOT NULL
      AND p.email IS NOT NULL
  LOOP
    -- In-app notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_rec.user_id,
      v_status_label || ': ' || NEW.name,
      'The cohort "' || NEW.name || '" has a status update: ' || v_status_label,
      v_status_type
    );

    -- Email notification
    PERFORM public.send_notification_email(
      v_rec.email,
      v_status_label || ': ' || NEW.name,
      'Hi ' || v_rec.company_name || '! The cohort "' || NEW.name || '" status has changed to: ' || v_status_label || '. Log in to the platform for more details.',
      v_status_type
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_cohort_status_update
AFTER UPDATE OF status ON public.accelerator_cohorts
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_cohort_status_change();


-- 3. MENTORING SESSION BOOKED EMAIL
-- Fires when a new mentoring session is created
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
  v_session_date text;
BEGIN
  -- Get mentor info
  SELECT p.email, COALESCE(p.full_name, p.email)
  INTO v_mentor_email, v_mentor_name
  FROM public.profiles p
  WHERE p.user_id = NEW.mentor_id;

  -- Get mentee info
  SELECT p.email, COALESCE(p.full_name, p.email)
  INTO v_mentee_email, v_mentee_name
  FROM public.profiles p
  WHERE p.user_id = NEW.mentee_id;

  -- Format session date if available
  v_session_date := CASE
    WHEN NEW.scheduled_at IS NOT NULL THEN to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'Day, DD Month YYYY at HH12:MI AM UTC')
    ELSE 'TBD'
  END;

  -- Notify mentor
  IF v_mentor_email IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.mentor_id,
      '📅 New Session Booked',
      v_mentee_name || ' has booked a mentoring session with you for ' || v_session_date,
      'info'
    );

    PERFORM public.send_notification_email(
      v_mentor_email,
      '📅 New Mentoring Session Booked',
      v_mentee_name || ' has scheduled a mentoring session with you for ' || v_session_date || '. Please log in to confirm and prepare.',
      'info'
    );
  END IF;

  -- Notify mentee
  IF v_mentee_email IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.mentee_id,
      '✅ Session Confirmed',
      'Your session with ' || v_mentor_name || ' is booked for ' || v_session_date,
      'success'
    );

    PERFORM public.send_notification_email(
      v_mentee_email,
      '✅ Mentoring Session Confirmed',
      'Your mentoring session with ' || v_mentor_name || ' has been booked for ' || v_session_date || '. See you there!',
      'success'
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_mentoring_session_created
AFTER INSERT ON public.mentoring_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_session_booked();
