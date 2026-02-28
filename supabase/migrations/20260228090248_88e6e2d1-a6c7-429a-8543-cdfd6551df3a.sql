CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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
  FROM profiles WHERE user_id = NEW.user_id;

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
$fn$;

DROP TRIGGER IF EXISTS trigger_booking_status_notify ON public.hub_bookings;
CREATE TRIGGER trigger_booking_status_notify
AFTER UPDATE ON public.hub_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_status_change();