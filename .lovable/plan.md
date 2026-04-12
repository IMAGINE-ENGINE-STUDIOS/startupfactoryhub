

# Send Hot Deals Reminder Emails to Participating Startups

## Context

The `hot_deals_invited_startups` table is currently empty (cleared by migration). From the conversation history, two company invitations were sent:

- **Benjamin Perez** — `ben@arachnidsys.com` (Arachnid Systems)
- **Clint** — `Clint@nuview.space` (NuView Space)

Only Benjamin has registered a profile so far.

## Plan

### 1. Create a new edge function: `send-hot-deals-reminder`

A reminder email using the same green-branded template style as the original invite, with messaging focused on:

- **Urgency**: Event is next Tuesday, April 16th
- **Action required**: Register/complete their profile on startupfactoryhub.com (name, avatar, bio, pitch deck, Stripe Connect)
- **Event details**: Same agenda and format info as the original invite
- **CTA**: "COMPLETE YOUR PROFILE" button linking to the auth/register page

Subject: `Reminder — Complete Your Profile | Hot Deals April 16, 2026`

### 2. Send the reminder to both startups

Invoke the function for:
- `ben@arachnidsys.com` (Benjamin, Arachnid Systems)
- `Clint@nuview.space` (Clint, NuView Space)

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-hot-deals-reminder/index.ts` | New edge function with reminder email template |

