

# Fix Live Chat Realtime Sync, Instant Message Display, and Mobile Banner

## Issues

1. **Live chat messages don't appear immediately** — When a user sends a message, it relies solely on the realtime subscription to echo it back. There's a delay because the INSERT must round-trip through Supabase. Fix: add an optimistic update so the message appears instantly in the sender's UI before the server confirms.

2. **Realtime subscription may miss messages** — The current subscription appends new messages but doesn't deduplicate against optimistically added ones. Fix: deduplicate by message ID when the realtime event arrives.

3. **SpaceEventBanner not mobile-friendly** — The canvas renders at fixed 1200x630 and has `style={{ maxWidth: '100%', height: 'auto' }}` but the parent container doesn't constrain width on mobile, causing horizontal overflow. Fix: wrap in a responsive container with `overflow-hidden` and ensure the canvas scales down properly on small screens.

## Technical Changes

### File: `src/components/HotDealsLiveChat.tsx`

- **Optimistic send**: When `sendMessage()` is called, immediately push a temporary message object (with a temporary ID like `temp-{timestamp}`) into the `messages` state before the `await supabase.from(...).insert(...)` call. This makes the message appear instantly.
- **Deduplicate on realtime**: In the realtime INSERT handler, check if a message with the same content/sender/timestamp already exists (from optimistic update) and replace the temp entry with the real one, or skip if already present.
- **Auto-scroll**: Already in place, no changes needed.

### File: `src/components/marketing/SpaceEventBanner.tsx`

- Wrap the canvas container with `overflow-hidden` and `max-w-full` to prevent horizontal scroll on mobile.
- Ensure the outer div has proper width constraints. The canvas already has `w-full h-full object-contain` and `maxWidth: 100%`, but the parent `div` with `style={{ aspectRatio: '1200/630' }}` needs `w-full` and `overflow-hidden` to clip properly on small screens.

### File: `src/pages/HotDealsPortal.tsx`

- Add `overflow-hidden` to the `SpaceEventBanner` wrapper div (the `scan-effect` div) to ensure it doesn't overflow on mobile.

## Files Modified
- `src/components/HotDealsLiveChat.tsx` — optimistic message display + deduplication
- `src/components/marketing/SpaceEventBanner.tsx` — mobile overflow fix
- `src/pages/HotDealsPortal.tsx` — banner container overflow fix

