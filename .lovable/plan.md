## Fix Four Broken Earth Intelligence Layers

### Issues Identified

1. **Shortwave Radiation (SWR) not working**  -- The WMS raster layer uses `{bbox-epsg-3857}`  which should work, but I suspect the layer ID lookup may be failing silently (the try/catch swallows errors). Additionally, the opacity setter tries `raster-opacity` which is correct for raster layers but may not apply if the source type is mismatched.  
2. **Snow Radar says "zoom not supported"** -- RainViewer tiles only render up to ~zoom 6-8. The snow layer has no `maxZoom` set, so Mapbox requests tiles at zoom 18. RainViewer returns "zoom not supported" placeholder images. Fix: set `maxZoom: 8` on the snow radar layer config.
3. **Lightning Strikes not showing** -- The Blitzortung tile URL (`tiles.blitzortung.org`) is likely CORS-blocked or requires referrer/auth. These tiles aren't freely accessible from client-side JS. Fix: replace with a working approach -- either proxy through an edge function, or use Blitzortung's publicly accessible GeoJSON websocket feed, or switch to WWLLN/alternative lightning tile provider.
4. **Active Hurricanes not working** -- The NOAA URLs (`nhc.noaa.gov/CurrentSurges.json` and `active_storms.json`) are CORS-blocked from browser fetch requests. The error is caught and silently falls through to an empty GeoJSON with zero features. Fix: use NOAA's ArcGIS REST Feature Service which supports CORS: `https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer`.

---

### Plan

#### 1. Fix SWR Hide (useEarthIntelligence.ts)

- Ensure `toggleDataset` includes `enableLayerOnMap` and `disableLayerOnMap` in its dependency array to prevent stale closures.

#### 2. Fix Snow Radar Zoom (useEarthIntelligence.ts)

- Add `maxZoom: 8` to the `rainviewer-snow` layer definition in `STATIC_EARTH_LAYERS`.
- This prevents Mapbox from requesting tiles at zoom levels RainViewer doesn't support.

#### 3. Fix Lightning Strikes (useEarthIntelligence.ts)

- Replace the broken Blitzortung tile approach with a working data source.
- Option A (recommended): Add a dedicated `addLightningLayer` function (similar to `addEarthquakeLayer`) that fetches from Blitzortung's public JSON API (`https://map.blitzortung.org/GEOjson/Data/...`) via an edge function proxy, then renders strikes as circle markers with time-based coloring.
- Option B (simpler): Use the WWLLN or an alternative publicly-accessible lightning tile service.

#### 4. Fix Active Hurricanes (useEarthIntelligence.ts)

- Replace the CORS-blocked NOAA fetch URLs with ArcGIS Feature Service endpoints:
  - Active storm points: `https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/0/query?where=1=1&f=geojson&outFields=*`
  - Forecast tracks: `FeatureServer/2/query?...` (line geometries)
  - Forecast cones: `FeatureServer/3/query?...` (polygon geometries)
- Render storm points as purple circles, forecast tracks as dashed lines, and forecast cones as semi-transparent fill polygons.
- If no active storms exist, the service returns an empty feature collection gracefully.

#### 5. Add dependency fixes

- Fix the `toggleDataset` useCallback dependency array to include `enableLayerOnMap` and `disableLayerOnMap` to prevent stale closure bugs.

---

### Technical Details

**Files modified:** `src/hooks/useEarthIntelligence.ts`

**New edge function (if Option A for lightning):** `supabase/functions/lightning-data/index.ts` -- proxies Blitzortung API to avoid CORS.

**No UI changes required** -- all fixes are in the data layer logic.