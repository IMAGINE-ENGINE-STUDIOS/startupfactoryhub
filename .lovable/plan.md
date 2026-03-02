

## Analysis of the Problem

Looking at the edge function logs, I can identify **three critical issues** causing the AIS tracking to fail or return inconsistent data:

### Issue 1: Invalid Bounding Boxes
The logs show longitude values like `-191.04` and `-156.37`, which are **outside the valid range** (-180 to 180). AISStream silently rejects these, returning 0 vessels. This happens because Mapbox's `getBounds()` can return longitudes outside [-180, 180] when the map is zoomed out or wrapped.

### Issue 2: Excessively Large Bounding Boxes
Requests like `bbox: -9, -156 to 58, -0.1` span nearly the entire globe. AISStream's WebSocket delivers data one vessel at a time, and with only a 6-second collection window, it cannot stream enough vessels for such a massive area. When it does connect successfully (e.g., the Gulf of Mexico bbox), it collected 20 vessels -- but for huge areas it times out with 0.

### Issue 3: WebSocket Connection Instability
Many requests show `Connected: false` at timeout -- the WebSocket never even opened. Edge functions have a short execution window and concurrent invocations can race each other. The function also lacks retry logic.

---

## Plan

### 1. Fix bounding box normalization (Edge Function)
- Clamp longitude values to [-180, 180] and latitude to [-90, 90] before sending to AISStream
- If the viewport is too large (e.g., > 30 degrees span), subdivide or cap it to a reasonable area centered on the viewport center to get denser results

### 2. Increase collection duration and add connection timeout
- Increase `COLLECT_DURATION` from 6s to 15s for more vessel data
- Add a separate connection timeout (5s) -- if the WebSocket doesn't open within 5s, reject early with a clear error instead of waiting the full duration with 0 vessels

### 3. Add viewport size guard on the frontend
- In `useAISTracking.ts`, before calling the edge function, check if the map zoom level is too low (e.g., < 4). If so, show a message like "Zoom in to see vessel data" instead of making a request that will return sparse/no results
- Clamp bounds to valid ranges on the client side as well

### 4. Clean up remaining `isDemo` references
- Remove the `isDemo` state from `useAISTracking.ts` entirely (it's hardcoded to `false` now)
- Remove all `isDemo` props and UI badges from `AISControlPanel.tsx`, `GISControlPanel.tsx`, `HubsMapViewLab.tsx`, and `GlobalResourcesMap.tsx`

### 5. Improve error UX
- When the edge function returns 0 vessels with no error, show a contextual message: "No vessels found in this area. Try zooming into a port or shipping lane."
- Display the actual error message from the edge function in the control panel instead of a generic failure

### Technical Details

**Bounding box clamping (edge function):**
```text
latmin = clamp(latmin, -90, 90)
latmax = clamp(latmax, -90, 90)
lonmin = clamp(lonmin, -180, 180)
lonmax = clamp(lonmax, -180, 180)
```

**Viewport guard (frontend):**
```text
if zoom < 4 → show "zoom in" message, skip fetch
if zoom < 7 → cap bbox to ~10° around center
```

**Files to modify:**
- `supabase/functions/ais-proxy/index.ts` -- bbox clamping, longer timeout, connection guard
- `src/hooks/useAISTracking.ts` -- zoom guard, remove `isDemo`, better error messages
- `src/components/hubs/AISControlPanel.tsx` -- remove `isDemo` prop/UI, add "zoom in" state
- `src/components/hubs/GISControlPanel.tsx` -- remove `isDemo` passthrough
- `src/components/hubs/HubsMapViewLab.tsx` -- remove `isDemo` passthrough
- `src/components/GlobalResourcesMap.tsx` -- remove `isDemo` passthrough

