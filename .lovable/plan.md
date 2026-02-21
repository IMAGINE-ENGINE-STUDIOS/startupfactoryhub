
# Remove "Open in New Tab" Button from Live Room Post Cards

## What Changes
Remove the "Open in new tab" button (the ExternalLink icon button) from the `LiveRoomPostCard.tsx` component. The "Rejoin Meeting" / "Join" button works correctly, so only the broken external link button needs to be deleted.

## Technical Details

### File: `src/components/LiveRoomPostCard.tsx`

1. **Remove the ExternalLink button** (lines 284-292) -- the icon button with `onClick={openExternalLink}` and title "Open in new tab"
2. **Keep the Copy link button** next to it (lines 275-283) -- that one stays
3. **Remove the `openExternalLink` function** if it exists and is no longer used elsewhere
4. **Remove the `ExternalLink` icon import** if no longer used

No other files need changes. The "Join Video Call" / "Rejoin Meeting" button in `VideoConferencing.tsx` remains untouched.
