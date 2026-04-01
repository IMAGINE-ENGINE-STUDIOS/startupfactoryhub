

# Live Chat for Artemis Watch Party

## Overview
Add a real-time live chat panel to the Artemis Watch Party page so registered users can chat with each other while watching the launch. The chat will feature the Artemis II logo and follow the existing Matrix/neon-green glassmorphism design.

## Database

**New table: `artemis_watch_party_messages`**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `content` (text, not null)
- `created_at` (timestamptz, default now())

**RLS policies:**
- SELECT: any authenticated user can read all messages
- INSERT: authenticated users can insert their own messages (`user_id = auth.uid()`)

**Realtime:** Enable via `supabase_realtime` publication.

## New Component: `ArtemisLiveChat.tsx`

- Shows the Artemis II logo at the top of the chat panel
- Displays messages in a scrollable area with sender name, avatar, and timestamp
- Input field + send button at the bottom (only for authenticated users)
- Subscribes to Supabase realtime `INSERT` events on the new table
- Fetches sender profiles by joining/looking up the `profiles` table
- Auto-scrolls to newest messages
- Styled with `tech-card`, glassmorphism, and `font-futuristic` labels matching the page

## Integration in `ArtemisWatchParty.tsx`

- Place the live chat in the right sidebar column (below or replacing the "System Status" widget), or as a new section alongside the Whereby room
- Best placement: add it below the 3D Space Explorer in the right sidebar, replacing the System Status widget to keep the layout clean
- Only rendered when user is authenticated (use `useAuth()` to check)
- If not authenticated, show a "Sign in to join the live chat" prompt

## Technical Details

- Reuse patterns from the existing `study_group_messages` realtime chat implementation
- Use `useAuth()` from `AuthContext` for user detection
- Use Supabase client for queries and realtime subscriptions
- Fetch last ~50 messages on load, then append new ones via realtime
- Import Artemis logo from `src/assets/artemis-ii-logo.png`

