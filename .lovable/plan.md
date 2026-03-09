

# Real-Time Transit Vehicles, Enhanced CCTV, and 3D Buildings Upgrade

## Summary

Integrate GTFS-Realtime transit vehicle feeds (real buses/trains with GPS), fix camera marker hover bug, redesign CCTV popup as side panel with 5s refresh and map projection, and enhance 3D buildings.

**Transparency**: No public API tracks individual private cars in real-time. GTFS-RT provides real vehicle positions for public transit (buses, trains) -- these are actual vehicles with GPS updated every 10-30 seconds. Traffic congestion on roads is already shown via Mapbox Traffic tiles.

---

## Changes

### 1. Fix Camera Marker Hover Bug
**File**: `src/components/GlobalResourcesMap.tsx` (lines 1262-1296)
- Add `transform-origin: center center` to marker CSS so scale(1.2) doesn't shift position
- Add `will-change: transform` to prevent reflow

### 2. Redesign CCTV Popup as Side Panel
**File**: `src/components/earth/TrafficCameraPopup.tsx`
- Convert from small floating card to a right-side panel (400px wide, full height)
- Larger image area with 5-second auto-refresh (down from 30s)
- Show metadata: source, coordinates, last update time
- Add camera location projection: when camera is selected, show pulsing marker + FOV cone on map via GeoJSON source in GlobalResourcesMap

### 3. Camera Projection on Map
**File**: `src/components/GlobalResourcesMap.tsx`
- When `selectedCamera` is set, add a pulsing circle + semi-transparent FOV wedge GeoJSON layer at camera coordinates
- Remove on deselect

### 4. Enhanced 3D Buildings
**File**: `src/components/GlobalResourcesMap.tsx`
- Lower minzoom from 14 to 13
- Improve height-based color gradient with better contrast
- Add ambient occlusion-like darker base

### 5. Real-Time Transit Vehicles (GTFS-Realtime)
**New file**: `supabase/functions/realtime-vehicles/index.ts`
- Edge function that proxies free GTFS-RT feeds:
  - **MTA NYC** (buses): `https://gtfsrt.prod.obanyc.com/vehiclePositions` (protobuf)
  - **MBTA Boston**: `https://cdn.mbta.com/realtime/VehiclePositions.json` (JSON)
  - **LA Metro**: `https://api.metro.net/LACMTA/vehicle_positions/all` (JSON)
  - **SF BART**: `https://api.bart.gov/gtfsrt/tripupdate.aspx` (JSON available)
  - **Chicago CTA**: `http://www.ctabustracker.com/bustime/api/v2/getvehicles` (XML/JSON)
- Accept bounds, return vehicle positions with: id, lat, lng, route, heading, speed, vehicleType (bus/train), agency
- Cache per agency for 15 seconds

**New file**: `src/hooks/useRealtimeVehicles.ts`
- Hook that fetches vehicle positions from edge function based on map bounds
- Auto-refresh every 15 seconds
- Only active when zoom >= 10 and toggle is on

**File**: `src/components/GlobalResourcesMap.tsx`
- Add `showTransitVehicles` state toggle
- Render vehicles as small directional arrow markers (blue = bus, orange = train)
- Smooth position transitions using CSS
- Add toggle in Urban Infrastructure panel with vehicle count badge
- Add `Bus` icon import from lucide-react

### 6. Faster Camera Data Refresh
**File**: `src/hooks/useTrafficCameras.ts`
- Reduce cache TTL from 60s to 15s

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/GlobalResourcesMap.tsx` | Fix marker hover, add camera projection, enhance 3D buildings, add transit vehicle layer + toggle |
| `src/components/earth/TrafficCameraPopup.tsx` | Redesign as side panel with 5s refresh, metadata |
| `src/hooks/useTrafficCameras.ts` | Reduce cache to 15s |
| `supabase/functions/realtime-vehicles/index.ts` | New: proxy GTFS-RT feeds |
| `src/hooks/useRealtimeVehicles.ts` | New: hook for transit vehicle positions |
| `supabase/config.toml` | Add realtime-vehicles function config |

