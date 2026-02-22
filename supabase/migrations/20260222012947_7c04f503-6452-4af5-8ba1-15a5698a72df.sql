
-- Fix send_notification_email: hardcode the project URL and use vault for service role key
CREATE OR REPLACE FUNCTION public.send_notification_email(user_email text, notification_title text, notification_message text, notification_type text, actor_name text DEFAULT NULL::text, actor_avatar_url text DEFAULT NULL::text, actor_role text DEFAULT NULL::text, recipient_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  function_url text;
  service_key text;
BEGIN
  function_url := 'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/send-notification-email';
  
  -- Retrieve service role key from vault
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE WARNING 'Service role key not found in vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'to', user_email,
      'title', notification_title,
      'message', notification_message,
      'type', notification_type,
      'actorName', actor_name,
      'actorAvatarUrl', actor_avatar_url,
      'actorRole', actor_role,
      'recipientName', recipient_name
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send email notification: %', SQLERRM;
END;
$function$;

-- Also drop the old 7-param overload to avoid ambiguity
DROP FUNCTION IF EXISTS public.send_notification_email(text, text, text, text, text, text, text);

-- Ensure the on_new_message trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_new_message'
  ) THEN
    CREATE TRIGGER on_new_message
      AFTER INSERT ON public.messages
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_new_message();
  END IF;
END;
$$;
