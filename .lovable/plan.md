

# Enrich Emails with Actor Identity and Profile Pictures

## Overview
Update the automated email system so every triggered email includes the **username** and **profile picture** of the person who caused the event (e.g., who sent the connection request, who sent the message, who applied for the job, etc.). This makes emails feel personal and synced with real user activity.

## What Changes

### 1. Expand the `send-notification-email` Edge Function
- Add new optional fields to the request interface: `actorName`, `actorAvatarUrl`, `actorRole`
- Update the HTML template to render a **user card** showing the actor's avatar (circular image) and name right above the notification message
- Fallback: if no avatar is provided, show initials in a colored circle (like the platform does)

### 2. Update the `send_notification_email` Database Function
- Add 3 new parameters: `actor_name TEXT`, `actor_avatar_url TEXT`, `actor_role TEXT` (all with defaults so existing calls don't break)
- Pass these new fields in the JSON body sent to the edge function

### 3. Update All 10 Database Trigger Functions
Each trigger already fetches the actor's name — we just need to also fetch `avatar_url` and pass it through:

| Trigger Function | Actor (who triggers it) |
|---|---|
| `notify_new_connection` | Requester |
| `notify_connection_accepted` | Acceptor |
| `notify_new_message` | Sender |
| `notify_mentorship_request` | Mentee |
| `notify_session_booked` | Mentee (to mentor) / Mentor (to mentee) |
| `notify_job_application` | Applicant |
| `notify_application_status` | Company owner (implicit) |
| `notify_event_registration` | The user registering |
| `notify_cohort_acceptance` | Accelerator (implicit) |
| `notify_cohort_status_change` | Accelerator admin |

For each, we add a `SELECT avatar_url` alongside the existing name query and pass it to `send_notification_email`.

### 4. Update Weekly Digest
- Include avatar thumbnails next to new member names in the digest sections (startups, mentors, investors, accelerators)
- Fetch `avatar_url` alongside `full_name` in the user_roles join query

### 5. Update Partnership Announcement
- No actor needed (it's a platform announcement), but already working fine

## Technical Details

### Edge Function Changes (`send-notification-email/index.ts`)
- Extended interface:
  ```
  actorName?: string
  actorAvatarUrl?: string  
  actorRole?: string
  ```
- New HTML block inserted before the notification title showing a circular avatar image + actor name + role badge
- Avatar fallback: generates initials from `actorName` if no URL provided

### Database Function Signature Change (`send_notification_email`)
```sql
CREATE OR REPLACE FUNCTION public.send_notification_email(
  user_email TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT,
  actor_name TEXT DEFAULT NULL,
  actor_avatar_url TEXT DEFAULT NULL,
  actor_role TEXT DEFAULT NULL
)
```
- Adds the 3 new fields to the JSON body in `net.http_post`
- Existing callers that don't pass these fields will still work (defaults to NULL)

### Trigger Function Changes (example: `notify_new_connection`)
```sql
-- Current: only fetches name
SELECT COALESCE(full_name, email) INTO requester_name FROM profiles WHERE user_id = NEW.requester_id;

-- Updated: also fetches avatar
SELECT COALESCE(full_name, email), avatar_url INTO requester_name, requester_avatar 
FROM profiles WHERE user_id = NEW.requester_id;

-- Updated call:
PERFORM send_notification_email(
  addressee_email, 'New Connection Request', ..., 'connection',
  requester_name, requester_avatar, NULL
);
```
Same pattern applied to all 10 trigger functions.

### Weekly Digest Changes (`weekly-digest/index.ts`)
- Query updated: `profiles(full_name, avatar_url)`
- HTML template updated to show small circular avatar thumbnails next to each member name in the digest lists

### Email Monitor Admin Panel (`EmailMonitor.tsx`)
- Add optional `actorName` and `actorAvatarUrl` fields to the Notification test form so admins can test the enriched template

## Files Modified
1. `supabase/functions/send-notification-email/index.ts` — enriched template with actor card
2. `supabase/functions/weekly-digest/index.ts` — avatars in digest member lists
3. Database migration — update `send_notification_email` function + all 10 trigger functions
4. `src/components/admin/EmailMonitor.tsx` — add actor fields to test form

## Backward Compatibility
All new parameters use defaults (NULL), so existing code calling `send_notification_email` without actor data will continue to work — the actor card simply won't render in those cases.

