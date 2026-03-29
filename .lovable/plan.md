

# Integrate 10 New State Camera Systems with Real-Time Video

## States Without Dedicated Integration

Currently integrated: CA, FL, NY, VA, OH, TN, CO, TX, MO, OR, IL, NV, HI, WA, DE, MD, NC, GA, PA, NJ, LA, IN, MI, DC, AL, OK, MN, WI, AZ, SC, KY, IA, MA (33 states + DC)

The following 10 states have NO dedicated fetcher -- only generic 511 calls that frequently return empty results:

| # | State | API Source | Est. Cameras | Video Potential |
|---|-------|-----------|-------------|----------------|
| 1 | Connecticut | ctroads.org REST API + ArcGIS portal | 200+ | HLS streams available |
| 2 | Utah | udottraffic.utah.gov/api/v2/get/cameras (documented 511 v2) | 400+ | Views include VideoUrl |
| 3 | Arkansas | idrivearkansas.com 511 v2 API | 600+ | Some HLS streams |
| 4 | Mississippi | mdottraffic.com 511 API | 150+ | Snapshot primarily |
| 5 | West Virginia | wv511.org 511 API | 100+ | Some video feeds |
| 6 | Kansas | kandrive.gov 511 API | 200+ | Some HLS/MJPEG |
| 7 | Nebraska | 511.nebraska.gov 511 API | 150+ | Limited video |
| 8 | New Hampshire | newengland511.org 511 API | 80+ | Snapshot primarily |
| 9 | Maine | 511.maine.gov 511 API | 100+ | Some video |
| 10 | Vermont | 511vt.com 511 API | 60+ | Snapshot primarily |

**Total estimated new cameras: ~2,000+**

## Plan

### 1. Add 10 dedicated fetch functions to `sync-cameras/index.ts`

Each state gets a dedicated fetcher that uses verified API endpoints instead of the generic 511 fallback:

- **Connecticut**: Use `https://www.ctroads.org/api/getcameras?format=json` with proper field mapping. Also try ArcGIS portal at `gisportal.dot.ct.gov`.
- **Utah**: Use `https://www.udottraffic.utah.gov/api/v2/get/cameras?key=public&format=json` -- this is a documented API that returns `Views[].Url` for images and `Views[].VideoUrl` for streams.
- **Arkansas**: Use `https://www.idrivearkansas.com/api/v2/get/cameras?key=public&format=json` -- standard 511 v2 format with 600+ cameras.
- **Mississippi**: Use `https://mdottraffic.com/api/v2/get/cameras?key=public&format=json` with fallback URLs.
- **West Virginia**: Use `https://wv511.org/api/v2/get/cameras?key=public&format=json` with proper parsing for route-organized cameras.
- **Kansas**: Use `https://www.kandrive.gov/api/v2/get/cameras?key=public&format=json` -- KanDrive is the official travel info system.
- **Nebraska**: Use `https://511.nebraska.gov/api/v2/get/cameras?key=public&format=json`.
- **New Hampshire**: Use `https://www.newengland511.org/api/v2/get/cameras?key=public&format=json` (New England shared 511 system).
- **Maine**: Use `https://511.maine.gov/api/v2/get/cameras?key=public&format=json` with ArcGIS fallback.
- **Vermont**: Use `https://511vt.com/api/v2/get/cameras?key=public&format=json`.

Each fetcher will:
- Try multiple URL patterns (v2, legacy, ArcGIS) for resilience
- Extract `streamUrl` from `Views[].VideoUrl` fields for real-time video
- Use `validStreamUrl()` to validate HLS/MJPEG/MP4 stream URLs
- Set appropriate `refreshRate` based on source behavior

### 2. Register all 10 in the `allSources` array

Add entries like:
```
{ name: 'CT-CTRoads', fn: fetchConnecticutCameras },
{ name: 'UT-UDOT', fn: fetchUtahCameras },
{ name: 'AR-IDrive', fn: fetchArkansasCameras },
...
```

### 3. Enhance video stream detection

Update the `validStreamUrl()` function to also match common DOT video patterns:
- `.m3u8` HLS streams (most common for newer DOT systems)
- MJPEG endpoints with `/video/` or `/stream/` paths
- Direct MP4 feeds

### 4. Update `camera_catalog` region mapping

Ensure new cameras store proper `region` codes (CT, UT, AR, MS, WV, KS, NE, NH, ME, VT) for filtering.

## Technical Details

**File modified**: `supabase/functions/sync-cameras/index.ts`
- Add 10 new dedicated fetch functions (each ~30-50 lines)
- Register them in `allSources` array
- Enhance `validStreamUrl()` for broader stream detection

**No database migration needed** -- cameras insert into existing `camera_catalog` table.

**After deployment**: Run sync to populate all new cameras. The existing frontend (popup, timeline, recording) will automatically support the new cameras including video playback for those with stream URLs.

