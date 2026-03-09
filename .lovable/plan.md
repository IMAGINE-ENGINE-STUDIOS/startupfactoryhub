

## Plan: Fix Build, Expand US Camera Coverage, Fix Live Feeds

### 1. Fix Build Error (Blocking)
The PWA plugin fails because the main JS bundle is 14MB, exceeding the 10MB `maximumFileSizeToCacheInBytes` limit in `vite.config.ts`. Increase it to 20MB on line 51.

### 2. Fix Green Icons With No Live Feed
The current code marks cameras as "streaming" (green) when `streamUrl` is set, but most sources don't actually provide working MJPEG/video stream URLs. The `streamUrl` field is populated from API response fields that contain HTML page links or broken URLs, not actual video streams.

**Root cause**: Only a few sources have real stream URLs:
- Caltrans `streamingVideoURL` may contain `.m3u8` HLS links (can't play natively without hls.js)
- NYCDOT `streamUrl` fields are speculative — the API structure isn't confirmed
- 511NY `VideoUrl` often contains page URLs, not stream URLs

**Fix**: Remove `streamUrl` assignment for sources that don't provide actual playable video streams. Only mark as streaming if the URL is a confirmed MJPEG endpoint (the only format that works natively in `<img>` tags). HLS `.m3u8` won't work without a library, so treat those as snapshot cameras with fast refresh instead.

### 3. Add Remaining US State Cameras
Add fetchers for states using the **511 API pattern** (`511[state].org/api/getcameras`) and **ArcGIS FeatureServer** endpoints. Many states use the same 511 platform:

| State | Source | API Pattern |
|-------|--------|-------------|
| NC | NCDOT | `https://tims.ncdot.gov/tims/api/traffic/cameras` or 511 |
| SC | SCDOT | `https://www.511sc.org/api/getcameras` |
| LA | LaDOTD | `https://www.511la.org/api/getcameras` |
| DC | DDOT | `https://opendata.dc.gov` Socrata API |
| OH | ODOT | `https://publicapi.ohgo.com/api/v1/Cameras` |
| MI | MDOT | `https://mdotjboss.state.mi.us/MiDrive/camera` |
| MN | MnDOT | `https://511mn.org/api/getcameras` |
| IN | INDOT | ArcGIS or 511 |
| WI | WisDOT | `https://511wi.gov/api/getcameras` |
| MO | MoDOT | `https://traveler.modot.org` |
| TN | TDOT | `https://smartway.tn.gov/traffic/api/cameras` |
| KY | KYTC | `https://511.ky.gov/api/getcameras` |
| AL | ALDOT | ArcGIS |
| MA | MassDOT | `https://511ma.com/api/getcameras` |
| CT | CTDOT | `https://www.ct.gov/dot` |
| AZ | ADOT | `https://az511.gov/api/getcameras` |
| NV | NDOT | `https://nvroads.com/api/getcameras` |
| UT | UDOT | `https://udottraffic.utah.gov` |

Many of these share the **511 platform** format (`/api/getcameras?format=json&key=public`), so I'll create a generic `fetch511Cameras(stateCode, baseUrl, bounds, boundsFilter)` helper to avoid repeating code for each state.

### 4. Street Cameras (Not Just Highways)
Most DOT cameras are highway-only. To add street-level cameras:
- **Windy.com webcams** already include street/city cameras — increase their limit and priority
- **Austin TX** Socrata data includes intersection cameras (already implemented)
- **DC OpenData** includes traffic signal cameras at intersections
- For NYC, the NYCDOT API includes local road cameras, not just highways

### 5. Increase Camera Limits
- Raise the per-source slice limits from 80-100 to 200-300
- Raise the global dedup limit from 800 to 1500
- Increase Windy limit to 300 (it's the main source for non-highway cameras)

### Files to Modify
- **`vite.config.ts`** — increase PWA cache limit to 20MB (fixes build)
- **`supabase/functions/traffic-cameras/index.ts`** — add ~15 new state fetchers using generic 511 helper, fix streamUrl logic, increase limits

### Technical Approach
Create a reusable function:
```typescript
async function fetch511StateCameras(
  stateCode: string, 
  baseUrl: string, 
  bounds: Bounds, 
  boundsCheck: (b: Bounds) => boolean,
  refreshRate: number
): Promise<CameraResult[]>
```

This reduces ~500 lines of repetitive code to ~30 lines per state (just the bounds check and URL).

