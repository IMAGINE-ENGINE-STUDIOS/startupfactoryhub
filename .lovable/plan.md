

# Fix Camera Markers Flying Away + Add All Florida Weather/CCTV Cameras

## Problem Analysis

**Flying away bug root cause**: The camera marker `useEffect` (line 1307-1375) has a cleanup function that **destroys ALL markers** every time the effect re-runs. Since `setSelectedCamera` is in the dependency array, clicking a camera triggers a state change → effect re-runs → cleanup removes all markers → re-adds them, causing a visible flash/jump. Additionally, `pitchAlignment: 'map'` (line 1361) causes 3D projection instability.

## Plan

### 1. Fix Camera Markers Flying Away (GlobalResourcesMap.tsx)

Three targeted changes:

- **Remove the cleanup function** (lines 1370-1374) that destroys all markers on every effect re-run. Cleanup already happens in lines 1310-1315 when `showCCTV` is toggled off.
- **Remove `pitchAlignment: 'map'`** from marker options (line 1361) — use default viewport alignment so markers stay screen-stable.
- **Remove `setSelectedCamera` from deps** (line 1375) — useState setters are stable references and don't need to be deps. Change to `[trafficCameras, showCCTV, mapReady]`.

### 2. Add All Florida & Weather Cameras (traffic-cameras/index.ts)

Add new fetcher functions for comprehensive Florida coverage:

- **FDOT District Cameras via Windy focused queries**: Add a dedicated `fetchFloridaWindyCameras` function that makes multiple Windy API calls centered on key Florida cities (Orlando, Miami, Tampa, Naples, Cape Coral, Fort Lauderdale, Jacksonville, etc.) to pull all weather webcams in the state.
- **FDOT SunGuide ITS Districts**: Add fetchers for each FDOT district's SunGuide/ITS camera feeds:
  - District 1 (SW FL - Naples, Cape Coral, Fort Myers)
  - District 2 (NE FL - Jacksonville)  
  - District 4 (SE FL - Fort Lauderdale, Palm Beach)
  - District 5 (Central FL - Orlando, Orange County)
  - District 6 (Miami-Dade)
  - District 7 (Tampa Bay, Polk County)
- **WeatherBug / NWS cameras**: Add National Weather Service webcam feeds for Florida locations.
- **Increase Florida camera limits**: Raise per-source slices from 200 to 500 for FL sources, and increase the global dedup limit from 300 to 500.

### 3. Deploy Updated Edge Function

Redeploy the `traffic-cameras` edge function with the new Florida sources.

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/GlobalResourcesMap.tsx` | Remove cleanup function, remove `pitchAlignment: 'map'`, fix deps array |
| `supabase/functions/traffic-cameras/index.ts` | Add Florida city-specific Windy queries, FDOT district cameras, increase limits |

