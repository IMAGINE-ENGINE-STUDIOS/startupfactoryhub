

## Plan: Replace Network Perks bar with Map Command Center

### What changes

**Remove** the entire bottom "Network Perks" bar (lines ~2520-2631 in `GlobalResourcesMap.tsx`) and the `RecordingSessionsWidget` clock icon. **Replace** with a new persistent bottom control panel component: `MapCommandCenter`.

**Remove** the standalone `RecordingSessionsWidget` from the map since its functionality moves into the Studio tab.

### New Component: `src/components/earth/MapCommandCenter.tsx`

A collapsible bottom panel with two sections:

**1. Search Bar (top area)**
- Mapbox Geocoding API search for locations/POIs (already available, no extra key needed — uses the existing Mapbox token)
- Type-ahead suggestions dropdown with place names, addresses, coordinates
- On select: `map.flyTo()` to the result
- Optional Genius AI fallback: if the search query looks like a natural language question (not a place name), route it through Genius AI for interpretation

**2. Tabs below the search bar**

- **Studio** tab (primary): Lists all recording sessions from `useRecordingSessions` store
  - Each session row shows: camera thumbnail (latest snapshot), camera name, recording duration, status (recording/stopped), frame count
  - Active sessions show pulsing red indicator + Stop button
  - Stopped sessions show Play button
  - Play opens the existing `SessionPlaybackPanel` in fullscreen with all time machine/playback tools
  - Delete button per session
  
- **Perks** tab: Moves the existing network perks cards here (preserves functionality, just relocates)

### Layout
- Collapsed state: A slim bottom bar showing just the search input + tab labels
- Expanded state: Search + scrollable tab content, max height ~50% viewport
- Position: `absolute bottom-4`, spans width minus left panel offset
- Same glassmorphism styling as existing UI (`backdrop-blur-3xl bg-black/80 border-white/20`)

### Files to modify

1. **Create** `src/components/earth/MapCommandCenter.tsx` — New component with search + tabs (Studio, Perks)
2. **Modify** `src/components/GlobalResourcesMap.tsx`:
   - Remove the bottom perks section (lines ~2520-2631)
   - Remove `RecordingSessionsWidget` usage (line ~3082-3086)
   - Remove `isPerksExpanded` state
   - Add `MapCommandCenter` passing: `map` ref, sessions store, perks data, `onPlaySession` callback, `onFlyTo`
3. **Delete or deprecate** `src/components/earth/RecordingSessionsWidget.tsx` — functionality absorbed into MapCommandCenter Studio tab

### Search implementation detail
- Uses Mapbox Geocoding API: `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}`
- Debounced (300ms) type-ahead
- Results show place name + context (city, country)
- Selecting a result calls `map.flyTo({ center, zoom })` with appropriate zoom based on result type (country=4, city=10, address=16, poi=15)

