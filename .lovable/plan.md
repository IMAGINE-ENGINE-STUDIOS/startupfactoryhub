

# Fix Message Email Notifications

## Problem
The `send_notification_email()` database function calls `net.http_post()` but the URL is NULL because `current_setting('app.settings.supabase_url', true)` and `current_setting('app.settings.service_role_key', true)` are not configured, causing the "null value in column url" error.

## Solution
Update the `send_notification_email()` function to use the known Supabase project URL directly instead of relying on unconfigured database settings. Also ensure the trigger exists on the messages table.

## Technical Details

### Step 1: Database Migration
Run a single migration that:

1. Sets the required database configuration values so all notification functions work:
```sql
ALTER ROLE authenticator SET app.settings.supabase_url = 'https://zqiihhmdsdgwdcwmryym.supabase.co';
ALTER ROLE authenticator SET app.settings.service_role_key = '<service_role_key from vault>';
```

OR (simpler and more reliable) replace the `send_notification_email` function to hardcode the project URL and retrieve the service role key from the Supabase vault:

```sql
CREATE OR REPLACE FUNCTION public.send_notification_email(...)
  -- Use hardcoded URL: 'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/send-notification-email'
  -- Use: current_setting('supabase_admin.service_role_key', true)
  --   or read from vault
```

2. Ensure the `on_new_message` trigger exists:
```sql
CREATE TRIGGER IF NOT EXISTS on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
```

### Step 2: No Frontend Code Changes
The existing messaging UI and edge function remain untouched -- only the database-level URL resolution is being fixed.

### Why This Fixes It
- The `send_notification_email` function currently builds the edge function URL from `app.settings.supabase_url`, which is NULL
- By providing the actual URL, `net.http_post` will receive a valid URL and successfully call the `send-notification-email` edge function
- The edge function then uses the RESEND_API_KEY (already configured) to deliver the email

