
Goal: make Florida cameras visible, increase California and nationwide camera density, keep existing camera popup/timeline/video features intact, set transit vehicles OFF by default, and introduce a digital-twin city replacement plan for current generic 3D buildings.

What I verified
- Backend `traffic-cameras` is returning large camera metadata successfully:
  - Orlando bounds: hundreds returned.
  - Florida statewide: ~1.6k returned.
  - California statewide: exactly ~2k returned.
- In `useTrafficCameras`, markers are only shown after client-side feed validation passes.
- Florida image URLs currently returned from FL ArcGIS (`images-dim.divas.cloud/...`) are returning 404 when tested through proxy; this causes 0 validated cameras => no Florida markers.
- California appears “too few” because:
  1) ArcGIS fetch is capped (exact 2000 indicates server page limit), and
  2) client validation is sequential batched and can take long for large result sets,
  3) coordinate-based dedupe removes colocated cameras.

Root causes to fix
1) FL source gives stale/dead image URLs (metadata exists, feeds dead).
2) CA ingestion is not paginated (hard cap likely truncating inventory).
3) UI visibility is coupled to feed verification (dead/slow feeds disappear entirely).
4) Proximity dedupe removes legitimate multi-direction cameras at same pole.
5) Transit toggle defaults ON in `GlobalResourcesMap` (`showTransitVehicles` true).

Implementation plan

Phase 1 — Source reliability + full ingestion (Edge Function)
Files: `supabase/functions/traffic-cameras/index.ts`
1. Add ArcGIS pagination for all ArcGIS fetchers (`resultOffset/resultRecordCount` loop until no `exceededTransferLimit`) so CA/large states are not capped.
2. Replace coordinate-only dedupe with stable dedupe key:
   - primary: `source + id`
   - fallback: `source + lat + lng + imageUrl`
   This preserves colocated multi-camera directions.
3. Florida hard fix:
   - keep current FL dataset for coordinates/metadata,
   - add FL fallback resolver for live image endpoint(s) using camera ID mapping,
   - if still unresolved, return camera as metadata-visible but feed status “unverified/dead” (instead of dropping it).
4. Add per-source health metrics in logs: fetched, valid image URL count, dead URL count, post-dedupe count.

Phase 2 — “All cameras visible” behavior without breaking current features
Files: `src/hooks/useTrafficCameras.ts`, `src/components/GlobalResourcesMap.tsx`, `src/components/earth/TrafficCameraPopup.tsx`
1. Decouple visibility from validation:
   - show all cameras returned by backend immediately,
   - run validation queue in background to set `feedVerified` state.
2. Marker styling by status:
   - verified live/stream: green,
   - unverified/unknown: amber,
   - known dead: gray (still visible to satisfy “all cameras”).
3. Keep current popup/time-machine/video behavior:
   - if dead/unverified feed is opened, show explicit status + retry + source link.
4. Keep viewport performance:
   - use Mapbox source clustering at low zoom and uncluster at higher zoom.
   - avoid clearing all markers instantly on every pan; swap atomically when new data arrives.

Phase 3 — UX defaults and guardrails
Files: `src/components/GlobalResourcesMap.tsx`
1. Set transit vehicles default OFF:
   - `const [showTransitVehicles, setShowTransitVehicles] = useState(false);`
2. Keep all other intelligence layers and camera popup UX unchanged.
3. Update CCTV helper copy to reflect status colors and that all cameras are shown while feed health is validated.

Phase 4 — Digital twin city layer plan (replace generic 3D buildings by city)
Scope: create city registry + toggle mode where selected cities use city-specific twin layer config; outside those bounds, fallback to current extrusion.
Initial city list (requested + normalized names):
1. New York City
2. Washington, DC
3. Los Angeles
4. San Francisco
5. Tokyo
6. Orlando
7. Miami
8. Houston
9. Denver
10. Seattle
11. Boston

City integration model
- Add `digitalTwinCities` config with:
  - `id`, `name`, `bbox`, `center`, `defaultZoom`, `pitch`, `bearing`,
  - `buildingSource` (city-specific vector/tileset/open-data),
  - optional overlays (transit/sensors/cameras priority settings).
- Replace current single `3d-buildings` layer with:
  - `digital-twin-buildings` when viewport intersects a configured city,
  - fallback to current mapbox composite extrusion elsewhere.
- Keep the same UI switch label but route behavior through city-aware layer manager.

Validation checklist (end-to-end)
1. Orlando + Miami: cameras visible on map immediately; feed states update; popup works.
2. California statewide + Bay Area + LA: camera count increases vs current; no 2000 cap behavior.
3. National view: clusters appear at low zoom; uncluster shows dense local cameras.
4. Transit layer starts OFF on first load, can be enabled manually, still functions.
5. Timeline/video modes still work on verified feeds and fail gracefully on dead feeds.

Success criteria
- Florida markers visible consistently (not zero).
- California density materially higher than current.
- Nationwide “all cameras visible” achieved without removing existing CCTV/timeline/video features.
- Transit OFF by default.
- Digital twin city registry prepared for replacing generic 3D buildings with city-specific twins.
