

# Hot Deals: Emoji Chat, 3D Model Posts, Speaker Fix & Contact Button

## Issues Identified

1. **Live chat has no emoji support** — users cannot insert emojis into messages
2. **3D models cannot be shared in chat** — no way to post model cards in the conversation
3. **Speakers section not loading** — the `profiles` table has RLS that only allows `authenticated` users to SELECT; guests on the portal see nothing
4. **No way to contact speakers** — no button to message them; if not logged in, user should be prompted to register

## Plan

### 1. Add Emoji Picker to Live Chat
- Install `emoji-picker-react` package
- Add a `Smile` icon button next to the message input in `HotDealsLiveChat.tsx`
- Clicking it toggles a floating emoji picker popover
- Selecting an emoji inserts it at the cursor position in the input field

**File modified:** `src/components/HotDealsLiveChat.tsx`

### 2. Add 3D Model Sharing in Chat
- Add a `Rotate3d` icon button next to emoji picker
- Clicking opens a small dropdown showing the 4 NASA models (Apollo, Astronaut, Perseverance, James Webb)
- Selecting one sends a special message like `[3D] Apollo Lunar Module` into the chat
- When rendering messages, detect `[3D]` prefix and render an inline card with the model name, a `Rotate3d` icon, and a "View in 3D" link that scrolls to the 3D viewer section

**File modified:** `src/components/HotDealsLiveChat.tsx`

### 3. Fix Speakers Not Loading (RLS Issue)
- The `profiles` table SELECT policy is restricted to `authenticated` role
- The speakers are public figures for this event — we should NOT weaken profile RLS
- Instead, query the speaker data on the server side using an edge function, or hardcode fallback data
- **Best approach:** Create a simple edge function `get-hot-deals-speakers` that uses the service role key to fetch speaker profiles, bypassing RLS. This keeps profile RLS intact while allowing guests to see speaker info.

**File created:** `supabase/functions/get-hot-deals-speakers/index.ts`
**File modified:** `src/components/HotDealsSpeakers.tsx` — call edge function instead of direct Supabase query

### 4. Add Contact Button on Speaker Cards
- Add a `MessageSquare` icon button labeled "Contact" on each speaker card
- If user is logged in (`useAuth`): navigate to the messaging page with the speaker's `user_id` pre-selected, or open the existing chat/messaging dialog
- If user is NOT logged in: show a prompt/dialog directing them to register/login on the platform (link to `/auth`)

**File modified:** `src/components/HotDealsSpeakers.tsx` — add contact button with auth check and navigation logic

## Technical Details

### Edge Function: `get-hot-deals-speakers`
- Accepts no params, returns the two speaker profiles (name, avatar, bio)
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Hardcodes the speaker IDs so only those profiles are exposed

### Emoji Picker
- Use `emoji-picker-react` (lightweight, React-native)
- Position above input area with absolute positioning
- Close on outside click or emoji selection

### 3D Model Message Format
- Messages starting with `[3D:model-name]` are rendered as styled cards
- The model name maps to the SPACE_MODELS array for the link

### Files Summary
| File | Action |
|------|--------|
| `src/components/HotDealsLiveChat.tsx` | Add emoji picker, 3D model sharing, render 3D cards |
| `src/components/HotDealsSpeakers.tsx` | Fix data loading via edge function, add contact button |
| `supabase/functions/get-hot-deals-speakers/index.ts` | New edge function for guest-safe speaker data |

