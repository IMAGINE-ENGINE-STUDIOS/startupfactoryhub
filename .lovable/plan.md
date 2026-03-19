

## Fix Broken Earth Intelligence Layers

### Summary

Four issues to address: remove Shortwave Radiation entirely, fix Earthquakes (CORS-blocked USGS API), fix Infrared Satellite (RainViewer satellite frames likely not loading/rendering), and fix MODIS True Color rendering on the globe.

---

### 1. Delete Shortwave Radiation (SWR)

Remove all traces of SWR from the codebase:
- Remove `swr-modis-monthly` from `STATIC_EARTH_LAYERS`
- Remove `ds-swr` from `EARTH_DATASETS`
- Remove `ds-swr` from `LEGEND_SCALES` in `EarthLegendWidget.tsx`
- Remove the `radiation` category references if no other layers use it

---

### 2. Fix Earthquakes (CORS proxy)

The USGS GeoJSON endpoint (`earthquake.usgs.gov`) is being blocked by CORS in the preview. The fix is to create a Supabase Edge Function proxy (similar to the existing `lightning-data` function):

- Create `supabase/functions/earthquake-data/index.ts` that fetches from `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson` server-side and returns the GeoJSON
- Update `addEarthquakeLayer` to call the edge function instead of USGS directly
- Register in `supabase/config.toml`

---

### 3. Fix Infrared Satellite

The IR satellite layer uses RainViewer's satellite infrared frames. The issue is likely that:
- The satellite frames array may be empty (the API response structure may have changed)
- The tile URL pattern may be incorrect for satellite IR

Fix: Add console logging to debug, and ensure the satellite tile URL uses the correct RainViewer path format. Also verify the RainViewer API response includes `satellite.infrared.past` data. If the tiles themselves aren't rendering, ensure the layer is added with proper `beforeId` placement (same fix as MODIS overlap issue previously applied to raster layers).

---

### 4. Fix MODIS True Color

"Badly implemented on the planet" suggests the tiles aren't rendering correctly. Issues to investigate and fix:
- The GIBS layer name `MODIS_Terra_CorrectedReflectance_TrueColor` and `GoogleMapsCompatible_Level9` are correct
- The date may be set too recently (MODIS has 1-2 day latency) -- the 5-day buffer should handle this
- Ensure the tile URL is correctly constructed and the source `maxzoom: 9` matches the `GoogleMapsCompatible_Level9` TileMatrixSet
- The main fix: when the layer is toggled on, ensure the source is freshly created with the current date (not reusing a stale source). Currently `addEarthLayerToMap` skips source creation if it already exists (`!map.getSource(layer.id)`), which means stale tile URLs persist. Fix by always removing and re-adding the source.

---

### Technical Details

**Files modified:**
- `src/hooks/useEarthIntelligence.ts` -- Remove SWR, fix earthquake fetch, fix IR satellite, fix MODIS source refresh
- `src/components/earth/EarthLegendWidget.tsx` -- Remove SWR legend entry
- `supabase/config.toml` -- Register earthquake-data function
- `supabase/functions/earthquake-data/index.ts` (new) -- USGS proxy

**Key fix in `addEarthLayerToMap`:** Always remove existing source before re-adding to ensure fresh tile URLs:
```typescript
// Remove stale source/layer before re-adding
if (map.getSource(layer.id)) {
  if (map.getLayer(mapLayerId)) map.removeLayer(mapLayerId);
  map.removeSource(layer.id);
}
map.addSource(layer.id, { type: 'raster', tiles: [tileUrl], tileSize: 256, maxzoom: layer.maxZoom || 18 });
```

