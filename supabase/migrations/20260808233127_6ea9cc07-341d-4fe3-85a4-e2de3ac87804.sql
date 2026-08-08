CREATE OR REPLACE FUNCTION public.notify_calendar_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.booker_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES (
      NEW.booker_id,
      CASE WHEN NEW.status = 'confirmed' THEN 'Meeting confirmed'
           WHEN NEW.status = 'cancelled' THEN 'Meeting declined'
           ELSE 'Meeting updated' END,
      CASE WHEN NEW.status = 'confirmed' THEN 'Your meeting request was confirmed for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY HH24:MI')
           WHEN NEW.status = 'cancelled' THEN 'Your meeting request for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY HH24:MI') || ' was declined'
           ELSE 'Your meeting status changed to ' || NEW.status END,
      CASE WHEN NEW.status = 'cancelled' THEN 'warning' ELSE 'success' END,
      jsonb_build_object('booking_id', NEW.id, 'status', NEW.status, 'scheduled_at', NEW.scheduled_at)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_calendar_booking_status ON public.calendar_bookings;
CREATE TRIGGER trg_notify_calendar_booking_status
AFTER UPDATE ON public.calendar_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_calendar_booking_status();

CREATE OR REPLACE FUNCTION public.notify_calendar_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    NEW.host_id,
    'New meeting request',
    COALESCE(NEW.booker_name, 'Someone') || ' requested a meeting on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY HH24:MI'),
    'event',
    jsonb_build_object('booking_id', NEW.id, 'status', NEW.status, 'scheduled_at', NEW.scheduled_at, 'booker_email', NEW.booker_email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_calendar_booking_created ON public.calendar_bookings;
CREATE TRIGGER trg_notify_calendar_booking_created
AFTER INSERT ON public.calendar_bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_calendar_booking_created();