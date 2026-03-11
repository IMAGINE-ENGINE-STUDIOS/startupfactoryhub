

## Issues Identified

### 1. Route is unprotected — any visitor sees the same map
The `/4d-map` route has no auth guard. It renders `GlobalResourcesMap` directly. A non-logged-in user (or different logged-in user) sees the exact same component with the same hardcoded overrides:
- `isSubscribed = true`
- `tier = 'corporate'`
- `hasAccess = true` (in `useEarthIntelligence`)

All CCTV, 3D buildings, traffic, Earth Intelligence features are gated only by these hardcoded values — so every user sees everything. **If another user reports NOT seeing CCTV/3D buildings, it's likely a browser/Mapbox token issue, not an access control issue.** The code itself does not restrict any features by user or role.

### 2. Digital Twin cities config exists but is NOT wired into the map
The file `src/config/digitalTwinCities.ts` was created with city definitions (NYC, DC, LA, SF, etc.), but **no code in GlobalResourcesMap imports or uses it**. The map only renders generic Mapbox composite `fill-extrusion` buildings everywhere. There is no logic to:
- Detect when the viewport enters a digital twin city bbox
- Load Google Photorealistic 3D Tiles or city-specific building data
- Switch between generic extrusions and high-fidelity tiles

The digital twin registry is dead code — it was prepared but never integrated.

### 3. Google Photorealistic 3D Tiles require a Google Maps API key
To get "Google Earth-like" fully textured 3D buildings in cities, we need to use [Google Maps 3D Tiles API](https://developers.google.com/maps/documentation/tile/3d-tiles) via Mapbox's `addSource` with `type: '3d-model'` or a custom deck.gl layer. This requires:
- A Google Cloud API key with Map Tiles API enabled
- Integration via Mapbox custom layers or a Three.js overlay

---

## Plan

### Phase 1 — Ensure all users see the same map (verify/fix)
**File**: `src/pages/4DMap.tsx`, `src/components/GlobalResourcesMap.tsx`

The route is already public and all features are hardcoded unlocked. If a specific user can't see features, it's a client-side issue (browser WebGL support, Mapbox token rate limits). No code change needed here unless you want to add auth protection.

### Phase 2 — Integrate Google Photorealistic 3D Tiles for digital twin cities
**Requires**: A Google Cloud API key (Map Tiles API enabled)

1. **Add Google API key** as a Supabase secret (`GOOGLE_MAPS_API_KEY`) and expose it client-side via a small edge function or directly as a `VITE_` env var.

2. **Create `useDigitalTwinBuildings` hook** (`src/hooks/useDigitalTwinBuildings.ts`):
   - Listen to map `moveend` events
   - Call `findDigitalTwinCity(lng, lat)` from the existing registry
   - When viewport enters a twin city bbox at zoom >= 14:
     - Hide the generic `3d-buildings` layer
     - Add a `batched-model` source pointing to Google 3D Tiles endpoint:
       ```
       https://tile.googleapis.com/v1/3dtiles/root.json?key=API_KEY
       ```
     - Render via Mapbox `model` layer (Mapbox GL JS v3 supports 3D Tiles natively via `addSource({ type: 'batched-model' })`)
   - When viewport leaves all twin city bboxes:
     - Remove the 3D tiles source/layer
     - Re-show the generic `3d-buildings` layer

3. **Wire hook into `GlobalResourcesMap`**:
   - Import and call `useDigitalTwinBuildings(map.current, mapReady, show3DBuildings)`
   - The hook manages layer lifecycle internally

4. **Fallback**: If no Google API key is configured, silently use the existing generic extrusions everywhere (no error).

### Phase 3 — Alternative: Mapbox Standard style 3D landmarks (no API key needed)
If a Google API key is not available, we can use **Mapbox's built-in 3D landmarks** which are included in the `mapbox://styles/mapbox/standard` style. This gives photorealistic 3D models for major landmarks in cities like NYC, Tokyo, SF, London — not full city coverage like Google, but free and immediate.

This would involve switching the base style to Mapbox Standard and enabling the `landmarks` config property.

---

### Decision needed

To get fully textured 3D cities like Google Earth, a **Google Maps API key** is required. Do you have one, or should I:
- (A) Implement Google 3D Tiles integration (you provide or create a Google Cloud API key)
- (B) Use Mapbox Standard 3D landmarks as a free alternative (less coverage but no extra key needed)
- (C) Both — use Google 3D Tiles where available, Mapbox landmarks as fallback

