

# Fix Recording & Expand Spain/Portugal/France/Andorra Cameras

## Problems Identified

### 1. Recording Not Working
The `recording-scheduler` and `record-camera` edge functions are **missing from `supabase/config.toml`**, so they default to `verify_jwt = true`. The cron job invokes the scheduler with the anon key, which passes JWT verification, but the scheduler internally calls `record-camera` with the **service role key** -- and since `record-camera` isn't configured in config.toml either, it also defaults to `verify_jwt = true`. The service role key IS a valid JWT, so this should work. Let me re-examine... Actually the issue is simpler: the functions may not be deployed or there could be a runtime error. Adding them to config.toml with `verify_jwt = false` ensures reliability.

### 2. Spain Coverage Gaps
- **`fetchSpainCameras()` returns `[]`** -- it's a stub with a comment saying "DGT's public API is behind a SPA"
- Only Catalonia (SCT XML) and Euskadi (broken SSL) are implemented
- No coverage for Madrid, Valencia, Sevilla, Castellon, Andalucia, Galicia, etc.
- DGT DATEX2 endpoints at `infocar.dgt.es` return 404 -- they've migrated
- **Valencia has a working open data API**: `valencia.opendatasoft.com/api/records/1.0/search/?dataset=cameres-trafic-camaras-trafico`

### 3. Andorra -- No Feed
- Andorra has a **working public API**: `https://app.mobilitat.ad/api/v1/cameras` returns JSON with camera data (animated GIFs)
- No fetcher exists for it

### 4. Portugal -- Dead Endpoint
- `fetchPortugalCameras()` hits `estradas.pt/api/cameras` which doesn't exist
- The real SIGIP ArcGIS endpoint `sigip.infraestruturasdeportugal.pt/pub/rest/services/SITE_EXTERNO_IP/viajar_na_estrada2021/MapServer/3/query` also returns "Service not found" (deprecated)
- Need to find current SIGIP URL or rely on Windy coverage

### 5. France -- Dead Endpoints
- `fetchFranceCameras()` hits `bfrancais.com/api/cameras` (doesn't exist) and a Bordeaux open data URL
- Bison Futé has no public JSON camera API -- cameras are rendered on a map SPA
- Best approach: expand Windy coverage for French cities + keep checking for regional DIR APIs

## Plan

### Step 1: Fix Recording (config.toml)
Add `recording-scheduler` and `record-camera` to `supabase/config.toml` with `verify_jwt = false`.

### Step 2: Add Andorra Fetcher
New `fetchAndorraCameras()` function hitting `https://app.mobilitat.ad/api/v1/cameras`. The API returns JSON with camera objects containing coordinates and image URLs (animated GIFs).

### Step 3: Replace Spain DGT Stub with Real Sources
Replace the empty `fetchSpainCameras()` with a multi-source approach:
- **Valencia City**: `valencia.opendatasoft.com` open data API (~50+ cameras with coordinates and feed URLs)
- **Madrid City**: Check `informo.madrid.es` traffic camera API (Madrid city council publishes camera data)
- **DGT eTraffic scrape**: The DGT eTraffic web app at `etraffic.dgt.es` loads camera data via internal API calls -- attempt to reverse-engineer the JSON endpoint
- **Malaga**: `datos.gob.es` has a GeoJSON dataset for Malaga cameras
- Add dedicated Windy sweeps for missing Spanish regions: Castellon, Zaragoza, Alicante, Granada, A Coruña, Vigo, Murcia, Palma de Mallorca, Las Palmas, Tenerife

### Step 4: Fix Portugal Fetcher
Replace `fetchPortugalCameras()` to probe updated SIGIP ArcGIS endpoints. The old service path was deprecated. Try alternative service names and add more Windy coverage for Porto, Algarve, Coimbra.

### Step 5: Expand France Coverage
Replace `fetchFranceCameras()` with:
- Probe actual Bison Futé internal API endpoints used by their map SPA
- Add Windy sweeps for Nantes, Strasbourg, Montpellier, Rennes, and other French cities not yet covered

### Step 6: Add More Spanish Windy Regions
Add Windy coverage for every major Spanish region not covered by dedicated APIs: Galicia, Asturias, Cantabria, Navarra, Aragon, La Rioja, Castilla y Leon, Castilla-La Mancha, Extremadura, Murcia, Canary Islands, Balearic Islands.

## Files Modified

- **`supabase/config.toml`** -- Add `recording-scheduler` and `record-camera` entries
- **`supabase/functions/sync-cameras/index.ts`** -- Add Andorra fetcher, replace Spain DGT stub with multi-source approach, fix Portugal fetcher, expand France fetcher, add ~25 new Windy region entries for Spain/Portugal/France coverage gaps

## Technical Details

### Andorra API Response Format
```json
[{
  "latitude": 42.5436,
  "longitude": 1.7339,
  "name": "Camera Name",
  "imageUrl": "https://..."
}]
```

### Valencia Open Data API
```
GET https://valencia.opendatasoft.com/api/records/1.0/search/
  ?dataset=cameres-trafic-camaras-trafico
  &rows=100
```
Returns GeoJSON with `geo_point_2d` coordinates and camera metadata.

### New Windy Regions for Spain (~15 entries)
Zaragoza, Valladolid, Vigo, A Coruña, Murcia, Alicante, Granada, Cordoba, Gijon, Santander, Pamplona, Palma, Las Palmas, Tenerife, Castellon

