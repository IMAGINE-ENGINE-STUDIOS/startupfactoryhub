
-- Create trigger function for event invite notifications
CREATE OR REPLACE FUNCTION public.notify_event_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event_title text;
  v_event_date text;
  v_event_location text;
  v_inviter_name text;
  v_inviter_avatar text;
  v_invitee_email text;
  v_invitee_name text;
BEGIN
  -- Get event details
  SELECT title, 
         COALESCE(to_char(start_date AT TIME ZONE 'UTC', 'Day, DD Month YYYY at HH12:MI AM UTC'), 'TBD'),
         COALESCE(location, 'Online')
  INTO v_event_title, v_event_date, v_event_location
  FROM events WHERE id = NEW.event_id;

  -- Get inviter info
  SELECT COALESCE(full_name, email), avatar_url
  INTO v_inviter_name, v_inviter_avatar
  FROM profiles WHERE user_id = NEW.inviter_id;

  -- Get invitee info
  SELECT email, COALESCE(full_name, email)
  INTO v_invitee_email, v_invitee_name
  FROM profiles WHERE user_id = NEW.invitee_id;

  -- Create in-app notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    NEW.invitee_id,
    '📅 Event Invitation',
    v_inviter_name || ' invited you to "' || v_event_title || '" on ' || v_event_date,
    'event'
  );

  -- Send email notification
  IF v_invitee_email IS NOT NULL THEN
    PERFORM send_notification_email(
      v_invitee_email,
      '📅 You''re Invited to an Event!',
      'You have been invited by ' || v_inviter_name || ' to attend "<strong>' || v_event_title || '</strong>".<br><br>'
      || '📍 <strong>Location:</strong> ' || v_event_location || '<br>'
      || '🕐 <strong>Date:</strong> ' || v_event_date || '<br><br>'
      || 'Log in to the platform to view the event details and RSVP.',
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

-- Create trigger on event_invites table
DROP TRIGGER IF EXISTS on_event_invite_created ON public.event_invites;
CREATE TRIGGER on_event_invite_created
  AFTER INSERT ON public.event_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_invite();
