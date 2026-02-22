

# Enable Email Notifications for Messages

## Problem
The `notify_new_message()` database function exists and is fully implemented (creates in-app notification + sends email via `send-notification-email` edge function), but no trigger is attached to the messages table to fire it when a new message is sent.

## Solution
Create a database trigger on the `messages` table that calls `notify_new_message()` after every new message INSERT.

## Technical Details

### Database Migration
Create a trigger on the `public.messages` table:

```sql
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
```

This single migration is all that's needed -- the `notify_new_message()` function already:
- Looks up sender name and avatar from `profiles`
- Looks up receiver email and name from `profiles`
- Inserts a notification record for the receiver
- Calls `send_notification_email()` to deliver the branded email

### No Code Changes Required
The existing messaging UI and backend logic remain untouched. The trigger simply connects the existing function to the table event.

