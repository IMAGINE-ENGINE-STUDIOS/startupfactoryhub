# MVP Program LinkedIn Automation — Status & Verification

This automation is already built and active. Verified now against the live backend:

- Settings row exists: deadline 2026-09-30, 20 startups per batch, every 2 days, 10:00 AM local, enabled.
- Apply link stored: `https://startupfactoryhub.com/mvp-program?_build=2026-08-08T17%3A41%3A10.173Z`
- Scheduled job `mvp-program-linkedin-post` is active at `0 14 */2 * *` (10:00 AM New York) calling the `post-mvp-program` function.
- Post history table is currently empty — the automation has not fired yet, so nothing has been proven end to end.

## What this plan does

1. Trigger the campaign function manually once to produce a real post: AI-written announcement (different wording each run), the rendered banner with day countdown, batch size, deadline and the apply link.
2. Inspect the result: LinkedIn API response, banner image, and the row written to the post history table.
3. If the run fails, fix the cause (LinkedIn token/scope, banner rendering, or AI text step) and re-run until one full post succeeds.
4. Confirm the internal feed cross-post is also created for the same announcement.
5. Leave the every-2-days 10:00 AM schedule untouched once a live run succeeds.

## Notes

No new tables or schedules are needed. Text variety comes from the AI prompt, which already receives days-remaining, seats and deadline, and enforces a structured format (hook, what it is, who it's for, deadline + countdown, call to action with link).
