

# Create Speaker Invitation Edge Function

## Context

The existing `send-hot-deals-invite` is tailored for **companies pitching** (references pitch decks, Stripe donations, 10-minute pitches). Speakers have a different role — they present keynotes/talks, not pitches. They need a separate, formal invitation that:
- Addresses them as distinguished speakers/presenters
- Reminds them to complete their Startup Factory Hub profile (name, avatar, bio)
- Includes the full event agenda so they know when they speak
- Explains the event dynamics (voting, donations, leaderboard) so they understand the format
- Does NOT mention pitch decks, Stripe connect, or company profiles

## Changes

### 1. New Edge Function: `send-hot-deals-speaker-invite/index.ts`

A new edge function with a formal speaker invitation email template using the same green branding (`#0ea270`) and white background style as the existing invite.

**Request body**: `{ to, recipientName, role }` where `role` is their title (e.g., "Director, WIN" or "Technology Transfer Specialist")

**Email content**:
- **Header**: Same green gradient header with "HOT DEALS" branding, but subtitle reads "Speaker Invitation" instead of "You're Invited to Pitch"
- **Greeting**: "Dear [Name], We are honored to invite you as a distinguished speaker..."
- **Your Role**: Describes their role as a keynote/presenter at the event, referencing their title
- **Event Details**: Date, time, format (same box as existing)
- **Event Agenda**: Full agenda table (2:00 PM Welcome, 2:10 PM Pitches, 3:00 PM NASA presentation, 3:15 PM WIN Keynote, 3:30 PM Winner Announcement) — identical to the startup invite
- **Event Dynamics**: Explains the live competition format (fire-rating voting, investor donations, dynamic leaderboard, winner announcement) so speakers understand the interactive nature
- **Complete Your Profile**: Steps to register at startupfactoryhub.com, complete profile with name, avatar, and bio — NO mention of pitch decks or Stripe
- **CTA buttons**: "COMPLETE YOUR PROFILE" pointing to register URL, "VIEW EVENT PORTAL" pointing to portal
- **Footer**: Same branded footer

**Subject line**: "Speaker Invitation — Hot Deals in the Space Industry | April 16, 2026"

### 2. Deploy the new edge function

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-hot-deals-speaker-invite/index.ts` | New edge function with formal speaker invitation email template including agenda, dynamics, and profile completion reminder |

