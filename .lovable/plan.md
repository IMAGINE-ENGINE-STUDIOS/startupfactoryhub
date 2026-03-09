

# 4D Map Enhancement Plan: Real-Time CCTV, 3D Buildings, Traffic

## Overview

Add three real-data layers to the existing Mapbox globe: 3D extruded buildings, real-time traffic flow, and live public CCTV camera feeds. All using production APIs with no simulated data.

---

## 1. 3D Buildings Layer

**Approach**: Mapbox's `mapbox-streets-v8` composite source already includes a `building` layer with height data. We add a `fill-extrusion` layer on `style.load`.

- Add a `fill-extrusion` layer sourcing from the `building` source layer in the composite tileset
- Extrude buildings using `height` and `min-height` properties from the vector tiles
- Add a toggle in the Earth Intelligence panel to show/hide 3D buildings
- No API key needed -- this is built into Mapbox's default tilesets

**Performance**: Only rendered at zoom >= 14, uses Mapbox's native GPU-accelerated extrusions.

---

## 2. Real-Time Traffic Layer

**Approach**: Use Mapbox Traffic plugin via the `mapbox-traffic-v1` source. This is a real-time vector tile layer provided by Mapbox showing live traffic congestion on roads worldwide.

- Add `mapbox://mapbox.mapbox-traffic-v1` as a vector source
- Render traffic flow lines color-coded by congestion level (low/moderate/heavy/severe)
- Add toggle in the toolbar/panel
- No additional API key -- included with the existing Mapbox access token

**Performance**: Vector tiles, rendered natively by Mapbox GL.

---

## 3. Real-Time CCTV Cameras

**Approach**: Use free public DOT (Department of Transportation) camera APIs that provide real camera feeds.

**Data Sources** (all free, no API key required):
- **511 Traffic APIs** (multiple US states) -- provide camera locations + live image/stream URLs
- **Windy.com webcams API** -- global public webcams with thumbnails and streams (free tier: 1000 req/day, requires API key)

**Implementation**:
1. Create a Supabase Edge Function `traffic-cameras` that:
   - Accepts bounding box coordinates
   - Fetches from public 511/DOT feeds for the visible area
   - Returns camera locations, names, and live image URLs
   - Caches results for 60 seconds to respect rate limits

2. Add camera markers on the map as a new layer:
   - Camera icon markers at each location
   - Click to open a popup/card showing the live camera image (auto-refreshing)
   - Only fetch when zoom >= 10 to avoid overloading

3. Add a toggle in the toolbar panel

**API Key Needed**: A Windy Webcams API key for global coverage (free tier). Alternatively, we can start with US DOT feeds only (no key needed).

---

## 4. UI Integration

All three features get toggles added to the existing Earth Intelligence / toolbar panel:
- "3D Buildings" toggle (on by default at high zoom)
- "Live Traffic" toggle
- "CCTV Cameras" toggle

Each toggle controls layer visibility without re-fetching data unnecessarily.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/GlobalResourcesMap.tsx` | Add 3D buildings layer + traffic layer on style.load, add state/toggles for all 3 features, integrate camera markers |
| `src/hooks/useTrafficCameras.ts` | New hook: fetch cameras from edge function by bounds, manage markers |
| `supabase/functions/traffic-cameras/index.ts` | New edge function: proxy public DOT camera APIs |
| `src/components/earth/TrafficCameraPopup.tsx` | New component: camera detail card with live image |

---

## Important Notes

- **No fake data**: 3D buildings come from OpenStreetMap via Mapbox. Traffic is Mapbox's real-time feed. Cameras are from public DOT APIs.
- **Performance**: All layers use native Mapbox vector rendering. Camera markers only load at zoom >= 10. Building extrusions only at zoom >= 14.
- **Global vs US**: Traffic and buildings are global. CCTV cameras will initially cover US DOT feeds; can expand with Windy API key later.

