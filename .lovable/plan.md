## Problem

In the resource detail panel of `src/components/GlobalResourcesMap.tsx`:

1. **Bookmark** button (line ~3202) has no `onClick` at all — it does nothing.
2. **Share Resource** builds the URL from `window.location.origin`, so on preview it copies a `*.lovable.app` link instead of the platform domain.
3. **Get Directions** (`getDirections`, line ~1927) calls `window.open("https://www.google.com/maps/dir/...")` and leaves the app, even though the map already has a full internal routing system (`useMapRouting` + `RouteSelectionSheet` + turn-by-turn navigation) wired into `showDirections`.

## Fix

### 1. Bookmark → saved to the user's account
- Import the existing `useUserBookmarks`, `useBookmarkResource`, `useRemoveBookmark` hooks from `src/hooks/useResources.ts` into `GlobalResourcesMap.tsx` (they already write to the `resource_bookmarks` table with the correct `user_id`).
- Make the button a toggle: filled `Bookmark` icon + "Saved" when the resource id is in `bookmarkedIds`, outline + "Bookmark" otherwise.
- If no session, show a toast prompting sign-in (with a link to `/auth`) instead of failing silently.
- Add a **Saved Resources** section to the user's own profile view (`UserProfileDialog`, own-profile branch) listing bookmarked resources with a click that deep-links to `/resources?id=<id>`, plus a remove action.

### 2. Share → platform link
- Introduce a canonical base URL constant (`https://startupfactoryhub.com`) used for shared links, falling back to `window.location.origin` only for `localhost`.
- Share copies `https://startupfactoryhub.com/resources?id=<id>` (or `/emergency?id=<id>` in emergency mode).
- Same base applied to the existing tracking-link share (line ~775) so no Lovable URL is ever copied.
- Use `navigator.share` when available on mobile, with clipboard copy as fallback.

### 3. Get Directions → internal GPS
- Replace the `window.open` bodies of `getDirections(resource)` and `getEventDirections(event)` with:
  - resolve the user's current position (existing geolocation/tracking flow) as origin, falling back to letting the user pick an origin in the sheet;
  - `routing.getDirections(origin, { lat, lng, name: title })`;
  - `setShowDirections(true)` so the existing `RouteSelectionSheet` (routes, ETA, start navigation) opens in-app;
  - close/keep the detail panel so the route sheet is visible.
- No external Google Maps tab.

## Technical notes
- Files: `src/components/GlobalResourcesMap.tsx`, `src/components/UserProfileDialog.tsx`, small helper (`src/lib/platformUrl.ts`) for the canonical base URL.
- No database changes: `resource_bookmarks` and its RLS policies already exist.
- Verification: click Bookmark on a resource (signed in) and confirm the row persists and appears in the profile; copy a share link and confirm the `startupfactoryhub.com` domain; click Get Directions and confirm the route sheet opens instead of a new tab.
