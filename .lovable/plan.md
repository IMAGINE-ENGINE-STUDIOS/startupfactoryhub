

## Plan: Fix California and Texas Camera Sources

### Problem
Both California (Caltrans) and Texas (TxDOT) camera fetchers exist but return zero cameras because:
- **California**: Uses per-district JSON URLs (`cwwp2.dot.ca.gov/data/d{N}/cctv/cctvStatus{Label}.json`) that don't exist — the actual data is in `.txt` tab-delimited format, not JSON. The response parsing also doesn't match the real nested structure.
- **Texas**: Uses a non-existent endpoint (`its.txdot.gov/data/cctv_images.json`). TxDOT has no public JSON API for camera lists.

### Solution

#### 1. Replace California fetcher with Caltrans ArcGIS FeatureServer
Replace the broken per-district JSON approach (`fetchCaltransDistrict` + `fetchAllCaltrans`) with a single ArcGIS query to `caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/FeatureServer/0/query`.

- Confirmed working: returns `currentImageURL`, `streamingVideoURL`, `locationName`, `latitude`, `longitude`, `district`
- MaxRecordCount: 2000 (enough for viewport-bounded queries)
- Use spatial envelope filter with bounds, just like FL511
- `streamingVideoURL` provides HLS `.m3u8` streams for many cameras (live video support)
- Image URLs like `https://cwwp2.dot.ca.gov/data/d7/cctv/image/.../...jpg` — confirmed working
- refreshRate: 5s (images update every 2-60s per camera)

#### 2. Replace Texas fetcher with multiple working sources
- **Austin City Cameras**: Use `https://data.austintexas.gov/resource/b4k4-adkb.json` (Socrata API, ~500+ cameras with `https://cctv.austinmobility.io/image/{id}.jpg`)
- **Houston TranStar**: Scrape camera list from `traffic.houstontranstar.org` — they serve snapshot images at predictable URLs
- **Fallback**: The existing Windy API already covers Texas metros as a worldwide fallback, but we'll add explicit sources for better coverage

#### 3. File changes
**`supabase/functions/traffic-cameras/index.ts`**:
- Replace `fetchCaltransDistrict` and `fetchAllCaltrans` with a single `fetchCaltransCameras(bounds)` using ArcGIS FeatureServer
- Replace `fetchTXDOT` with `fetchAustinCameras(bounds)` + `fetchHoustonCameras(bounds)` using real working endpoints
- Stream URLs from Caltrans (`streamingVideoURL` field) will enable green dot markers on the map

### Technical Details

**Caltrans ArcGIS query URL:**
```
https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/FeatureServer/0/query
?where=1=1
&geometry={west},{south},{east},{north}
&geometryType=esriGeometryEnvelope
&spatialRel=esriSpatialRelIntersects
&outFields=currentImageURL,streamingVideoURL,locationName,latitude,longitude,district,inService
&f=json
&resultRecordCount=500
```

**Austin cameras Socrata API:**
```
https://data.austintexas.gov/resource/b4k4-adkb.json
?$where=within_box(location, {south}, {west}, {north}, {east})
&$limit=200
&camera_status=TURNED_ON
```

Redeploy edge function after changes.

