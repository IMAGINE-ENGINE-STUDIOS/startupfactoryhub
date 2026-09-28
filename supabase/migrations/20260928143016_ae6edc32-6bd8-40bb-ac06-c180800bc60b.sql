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
  FROM profiles WHERE user_id = NEW.invitee_id;

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