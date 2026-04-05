

# Fix Speaker Contact Button to Open Platform Messaging

## Problem
Clicking "Contact" on speakers navigates to `/messages?user=...` which is not a valid route. The platform's messaging system is the `FloatingChat` component, which listens for a `window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId } }))` event.

## Solution
Update `HotDealsSpeakers.tsx` to:

1. **Logged-in users**: Dispatch the `openFloatingChat` custom event with the speaker's `user_id`, which opens the FloatingChat panel directly to the conversation with that speaker
2. **Not logged in**: Navigate to `/auth` so they can register/sign in first

## Change

**File: `src/components/HotDealsSpeakers.tsx`**
- Replace `navigate('/messages?user=...')` with `window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId: speakerUserId } }))`
- Remove unused `useNavigate` import if no longer needed (still needed for `/auth` redirect)

This is a one-line logic change. No new files, no database changes.

