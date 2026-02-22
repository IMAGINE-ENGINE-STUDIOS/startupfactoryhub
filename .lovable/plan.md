

## Daily Activity Digest Email

### Overview
Create a new edge function `daily-activity-digest` that sends each user a personalized daily summary of engagement on their posts (likes, comments, bookmarks, shares) and any new followers, scheduled to run every day at 7:00 AM EST (12:00 UTC).

### What Gets Included
For each user who had activity in the last 24 hours:
- New likes on their posts (count + who liked)
- New comments on their posts (count + who commented)
- New bookmarks on their posts
- New shares of their posts
- New followers (if applicable)
- New messages received (count)
- New connection requests

Users with zero activity in the last 24 hours will NOT receive an email (no spam).

### Implementation Steps

**Step 1: Create the `daily-activity-digest` edge function**
- New file: `supabase/functions/daily-activity-digest/index.ts`
- Queries `post_likes`, `post_comments`, `post_bookmarks`, `feed_posts` (shares), `messages`, and `connections` for activity in the last 24 hours
- Groups activity by post owner (the user who receives the digest)
- Builds a branded HTML email matching the existing SFH green theme
- Sends via Resend API to each user who had activity
- Skips users with no activity

**Step 2: Set up a pg_cron job for 7:00 AM EST daily**
- 7:00 AM EST = 12:00 UTC
- Cron expression: `0 12 * * *`
- Uses `net.http_post` to invoke the edge function daily
- Executed via SQL insert (not migration, since it contains project-specific URLs/keys)

**Step 3: Add the template to the Email Templates page**
- Add a "Daily Activity Digest" entry in the Email Templates page (`src/pages/EmailTemplates.tsx`) so admins can preview it
- Trigger label: `pg_cron daily 7:00 AM EST`

### Technical Details

**Edge Function Logic:**
```
1. Query all post_likes created in last 24h, join with feed_posts to get post owner
2. Query all post_comments created in last 24h, join with feed_posts to get post owner
3. Query all post_bookmarks created in last 24h, join with feed_posts to get post owner
4. Query feed_posts with shared_post_id set, created in last 24h
5. Group all activity by receiving user_id
6. For each user with activity > 0:
   - Build personalized HTML digest
   - Send via Resend
7. Skip users with no activity
```

**Cron Job SQL (to run in SQL Editor):**
```sql
SELECT cron.schedule(
  'daily-activity-digest',
  '0 12 * * *',
  $$ SELECT net.http_post(
    url := 'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/daily-activity-digest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id; $$
);
```

**Email Template Design:**
- Same SFH branded header with logo
- "Your Daily Activity Summary" hero section
- Sections for each activity type with counts and actor names/avatars
- CTA button to "View Your Feed"
- Same footer as other emails

