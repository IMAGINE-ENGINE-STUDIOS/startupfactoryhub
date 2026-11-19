-- Registration confirmation guarantee for logged-in (platform) registrations.
-- Before: trigger_notify_event_registration fired AFTER INSERT only and sent a
-- thin email ("You have successfully registered for X") with no date, time or
-- join link -- and it fired even for 'maybe'/'declined' first RSVPs, while a
-- member who changed status INTO 'going' (an UPDATE) got nothing.
-- Deeper defect found during the end-to-end test (2026-11-19): the function
-- read the recipient email from profiles.email, which is NULL for ALL 312
-- profiles, so the email branch could never fire for anyone. The email is now
-- resolved from auth.users, the authoritative source.
-- After: fires on INSERT or UPDATE OF status, only on a transition INTO
-- 'going', and sends the same rich confirmation as the public registration
-- page (event title, date and time in ET, join link for virtual events,
-- venue for in-person), through send_notification_email -> the platform's
-- send-notification-email edge function and its official template.
CREATE OR REPLACE FUNCTION public.notify_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_title text;
  event_start timestamptz;
  event_end timestamptz;
  event_virtual boolean;
  event_room text;
  event_location text;
  user_email text;
  user_name text;
  user_avatar text;
  join_link text;
  date_line text;
  time_line text;
  access_html text;
  email_body text;
  safe_title text;
BEGIN
  -- Only a transition INTO 'going' earns a confirmation.
  IF NEW.status IS DISTINCT FROM 'going' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'going' THEN
    RETURN NEW;
  END IF;

  SELECT title, start_date, end_date, is_virtual, meeting_room_url, location
    INTO event_title, event_start, event_end, event_virtual, event_room, event_location
    FROM events WHERE id = NEW.event_id;

  -- Email comes from auth.users: profiles.email is NULL across the table.
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  SELECT COALESCE(full_name, user_email), avatar_url INTO user_name, user_avatar
    FROM profiles WHERE user_id = NEW.user_id;

  INSERT INTO notifications (user_id, title, message, type)
  VALUES (NEW.user_id, 'Event Registration Confirmed', 'You are registered for ' || event_title, 'success');

  IF user_email IS NOT NULL THEN
    join_link := CASE WHEN event_virtual THEN COALESCE(event_room, CASE WHEN event_location LIKE 'http%' THEN event_location END) END;
    date_line := to_char(event_start AT TIME ZONE 'America/New_York', 'FMDay, FMMonth FMDD, YYYY');
    time_line := to_char(event_start AT TIME ZONE 'America/New_York', 'FMI:MM AM') || ' - ' || to_char(event_end AT TIME ZONE 'America/New_York', 'FMI:MM AM');
    access_html := CASE
      WHEN join_link IS NOT NULL THEN '<p style="margin:18px 0 6px;"><strong>Join the event here:</strong></p><p style="margin:0 0 6px;"><a href="' || join_link || '" style="color:#34d399;word-break:break-all;">' || join_link || '</a></p><p style="margin:0;">Save this link. It is how you enter the event on Startup Factory Hub Live Video. No account needed, just your name and email.</p>'
      WHEN NOT event_virtual AND event_location IS NOT NULL THEN '<p style="margin:18px 0 0;"><strong>Where:</strong> ' || event_location || '</p>'
      ELSE ''
    END;
    safe_title := replace(replace(replace(event_title, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
    email_body := '<p>You''re registered for <strong>' || safe_title || '</strong>.</p><p>' || date_line || '<br/>' || time_line || '</p>' || access_html || '<p style="margin-top:18px;">See you there,<br/>Startup Factory Hub</p>';
    PERFORM send_notification_email(
      user_email, 'You''re registered: ' || event_title,
      email_body, 'event',
      user_name, user_avatar, NULL, user_name
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_event_registration ON event_attendees;
CREATE TRIGGER trigger_notify_event_registration
  AFTER INSERT OR UPDATE OF status ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_registration();
