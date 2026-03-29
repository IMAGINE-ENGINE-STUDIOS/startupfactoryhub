

# Integrate Final 10 Camera Systems -- Complete US Coverage

## Current Status
43 states + DC now have dedicated fetchers. The remaining **8 US states** only have generic 511 entries that often return empty results. Adding **2 US territories** brings the total to 10 new integrations.

## States and Territories to Integrate

| # | State/Territory | API Source | Est. Cameras | Video Potential |
|---|----------------|-----------|-------------|----------------|
| 1 | New Mexico | nmroads.com 511 v2 API | 200+ | Some HLS streams |
| 2 | Idaho | 511.idaho.gov 511 v2 API | 150+ | Some video feeds |
| 3 | Montana | 511mt.net 511 v2 API | 120+ | Snapshot primarily |
| 4 | Wyoming | wyoroad.info 511 v2 API | 100+ | Some HLS |
| 5 | North Dakota | travel.dot.nd.gov 511 v2 API | 80+ | Snapshot primarily |
| 6 | South Dakota | sd511.org 511 v2 API | 80+ | Snapshot primarily |
| 7 | Alaska | 511.alaska.gov 511 v2 API | 60+ | Limited video |
| 8 | Rhode Island | dot.ri.gov 511 API | 40+ | Snapshot primarily |
| 9 | Puerto Rico | dtop.gov.pr / ArcGIS | 50+ | Some video |
| 10 | US Virgin Islands | vitransonline.com | 10+ | Snapshot primarily |

**Total estimated new cameras: ~900+**
**After this: Complete coverage of all 50 US states + 2 territories**

## Plan

### 1. Add 10 dedicated fetch functions to `sync-cameras/index.ts`

Each state gets a dedicated fetcher with multiple URL fallbacks, same pattern as existing ones (CT, UT, etc.):

- **New Mexico**: `https://nmroads.com/api/v2/get/cameras?key=public&format=json` with ArcGIS fallback
- **Idaho**: `https://511.idaho.gov/api/v2/get/cameras?key=public&format=json`
- **Montana**: `https://www.511mt.net/api/v2/get/cameras?key=public&format=json`
- **Wyoming**: `https://www.wyoroad.info/api/v2/get/cameras?key=public&format=json`
- **North Dakota**: `https://travel.dot.nd.gov/api/v2/get/cameras?key=public&format=json`
- **South Dakota**: `https://sd511.org/api/v2/get/cameras?key=public&format=json`
- **Alaska**: `https://511.alaska.gov/api/v2/get/cameras?key=public&format=json`
- **Rhode Island**: `https://www.dot.ri.gov/511/api/v2/get/cameras?key=public&format=json`
- **Puerto Rico**: ArcGIS FeatureServer from DTOP portal
- **US Virgin Islands**: Direct camera feed parsing from VITRAN

### 2. Register all 10 in `allSources` and remove redundant generic 511 entries

Replace the generic 511 fallback entries (NM-511, ID-511, etc.) with the new dedicated fetchers.

### 3. Extract video streams where available

Same `Views[].VideoUrl` and `validStreamUrl()` pattern used for the previous 10 states.

## Technical Details

**File modified**: `supabase/functions/sync-cameras/index.ts`
- Add 10 new dedicated fetch functions (~30-50 lines each)
- Replace generic 511 entries with dedicated fetcher registrations in `allSources`
- No database migration needed

