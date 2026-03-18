

# Camera Infrastructure Audit and Integration Plan

## Current State

### Database Totals
- **15,550 total cameras** in `camera_catalog`
- **6,040 with video stream URLs** (38.8%) — real-time video capable
- **9,510 frame-only** (61.2%) — static snapshot refresh

### Cameras by Source (in DB today)

| Source | Total | With Stream | Type |
|--------|-------|-------------|------|
| 511NY | 2,919 | 1,753 | Mixed |
| FL511 | 2,220 | **0** | Frame only |
| IDOT Gateway (IL) | 2,000 | 0 | Frame only |
| WSDOT (WA) | 1,653 | 0 | Frame only (WebMercator coords!) |
| Caltrans D4 (CA) | 1,376 | 404 | Mixed |
| Caltrans D8 (CA) | 936 | 768 | Mixed |
| Caltrans D7 (CA) | 652 | 456 | Mixed |
| Caltrans D12 (CA) | 576 | 518 | Mixed |
| Caltrans D11 (CA) | 534 | 470 | Mixed |
| Caltrans D3 (CA) | 484 | 484 | All stream |
| MDSHA (MD) | 451 | 0 | Frame only |
| LADOTD (LA) | 435 | 373 | Mixed |
| Caltrans D5 (CA) | 324 | 324 | All stream |
| Caltrans D10 (CA) | 284 | 250 | Mixed |
| Caltrans D6 (CA) | 252 | 240 | Mixed |
| Caltrans D1 (CA) | 242 | 0 | Frame only |
| Caltrans D2 (CA) | 166 | 0 | Frame only |
| Caltrans D9 (CA) | 46 | 0 | Frame only |

### States Currently in DB (7 states)
California, New York, Florida, Illinois, Washington, Maryland, Louisiana

---

## Florida Analysis

### Why FL511 Video Feeds Are Missing
The FL511 ArcGIS FeatureServer (`FL511_Traffic_Cameras/FeatureServer/0`) **does not return video/stream URL fields** in its attributes. The sync code checks for `VideoURL`, `HlsUrl`, `HLSURL`, `StreamURL`, `MJPEG_URL` — all come back null/empty from the API. Result: all 2,220 FL cameras stored as frame-only with snapshot URLs like `https://fl511.com/map/Cctv/{id}`.

**The fix**: FL511.com actually serves MJPEG and HLS streams, but through a different endpoint pattern. The video URLs follow the format:
- `https://fl511.com/map/Cctv/GetVideo/{cameraId}` (HLS/MJPEG)
- `https://fl511.com/map/CctvImage/{cameraId}` (snapshot)

The sync code needs to **construct stream URLs** from the camera ID rather than hoping the ArcGIS API returns them.

### Florida Cities in DB (by coordinate clusters)

| Region | Approx Count | Status |
|--------|-------------|--------|
| Orlando area (lat~28, lng~-81) | 332 | Good coverage |
| Jacksonville/NE FL (lat~29-30, lng~-81) | 307 | Good |
| Tampa/St Pete (lat~27-28, lng~-82) | 408 | Good |
| Tallahassee (lat~30, lng~-84) | 218 | Good |
| Fort Lauderdale/W Palm (lat~26, lng~-80) | 168 | Moderate |
| Sarasota/Fort Myers (lat~27, lng~-83) | 152 | Good |
| Gainesville (lat~29, lng~-82) | 235 | Good |

### Missing Florida Cities
- **Miami-Dade** — Very underrepresented (only ~168 in the lat 26 / lng -80 cluster, shared with Fort Lauderdale)
- **Fort Lauderdale/Broward** — Needs dedicated coverage
- **Key West/Keys** — Zero coverage
- **Pensacola/Panama City** — Minimal (panhandle area sparse)
- **Daytona Beach** — Mixed into lat 29 cluster, unclear dedicated count

---

## 43 States Missing from Database

The sync function has code for ~45 sources beyond the 7 states in the DB, but they returned 0 cameras (API failures, wrong URLs, authentication required). Here's every missing state:

### Tier 1 — Major States, High Camera Counts Expected (must-have)
1. **Texas** — TxDOT ITS, Houston TranStar, Dallas, San Antonio, Austin, El Paso (~3,000+ cameras expected)
2. **Pennsylvania** — PennDOT ArcGIS + 511PA (~800+)
3. **Ohio** — OHGO API (~600+)
4. **Georgia** — GDOT ArcGIS + 511GA (~500+)
5. **Virginia** — 511VA GeoJSON (~600+)
6. **North Carolina** — NCDOT ArcGIS (~500+)
7. **New Jersey** — NJDOT ArcGIS + 511NJ (~400+)
8. **Michigan** — MDOT MI + SEMCOG ArcGIS (~400+)
9. **Indiana** — INDOT ArcGIS (~300+)
10. **Tennessee** — SmartWay API (~400+)
11. **Colorado** — CDOT API (~350+)
12. **Arizona** — ADOT ArcGIS + AZ511 (~300+)
13. **Minnesota** — MnDOT ArcGIS + Metro (~300+)

### Tier 2 — Medium States
14. **Wisconsin** — WisDOT ArcGIS (~200+)
15. **Missouri** — MoDOT API (~250+)
16. **Oregon** — TripCheck/ODOT (~300+)
17. **Massachusetts** — MassDOT ArcGIS (~200+)
18. **Connecticut** — 511CT (~150+)
19. **South Carolina** — SCDOT ArcGIS (~200+)
20. **Kentucky** — KYTC ArcGIS (~200+)
21. **Alabama** — ALDOT ArcGIS (~150+)
22. **Oklahoma** — ODOT OK ArcGIS (~150+)
23. **Iowa** — Iowa DOT ArcGIS (~200+)
24. **Nevada** — NDOT dedicated + NV511 (~100+)
25. **Utah** — UDOT 511 (~150+)
26. **DC** — DDOT ArcGIS (~80+)
27. **Arkansas** — 511AR (~100+)
28. **Louisiana** — (already in DB but 511LA backup missing)
29. **Kansas** — KanDrive (~100+)
30. **Mississippi** — MDOT Traffic (~100+)
31. **New Mexico** — NMRoads (~80+)
32. **Nebraska** — NE511 (~80+)

### Tier 3 — Smaller / Rural States
33. **West Virginia** — WV511 (~60+)
34. **Idaho** — ID511 (~80+)
35. **Hawaii** — GoAkamai + Honolulu (~50+)
36. **Montana** — MT511 (~40+)
37. **Wyoming** — WY511 (~40+)
38. **North Dakota** — ND511 (~30+)
39. **South Dakota** — SD511 (~30+)
40. **Alaska** — AK511 (~30+)
41. **Delaware** — DelDOT (~50+)
42. **Rhode Island** — RI DOT (~30+)
43. **Vermont** — VT511 (~20+)
44. **New Hampshire** — NH DOT (~25+)
45. **Maine** — ME511 (~30+)

### WSDOT Coordinate Bug
Washington's 1,653 cameras have **WebMercator coordinates** (lat values like 6,176,351) instead of WGS84 (~47.6). These need coordinate conversion during sync.

---

## Integration Plan

### Phase 1: Fix Florida Video Streams + Missing Cities
**Files**: `supabase/functions/sync-cameras/index.ts`

1. **Construct FL511 stream URLs** from camera IDs instead of relying on null ArcGIS fields:
   - Pattern: `https://fl511.com/map/Cctv/GetVideo/{id}` for HLS
   - Add FDOT SunGuide video endpoint as fallback
2. **Add Miami-Dade dedicated source** — Miami-Dade County Open Data GIS has a separate traffic camera layer
3. **Add Broward County** — Broward 511 cameras
4. **Add Florida Turnpike Enterprise** video feeds (separate from FL511)
5. Re-sync to populate `stream_url` for all 2,220 existing FL cameras

### Phase 2: Fix Broken State Sources (ArcGIS URLs)
Many ArcGIS URLs in the sync function are likely returning 404/403. For each:

1. **Verify each ArcGIS FeatureServer URL** — many state DOT ArcGIS services change URLs frequently
2. **Update broken URLs** with current endpoints from state DOT GIS portals
3. **Fix WSDOT coordinate conversion** — add WebMercator → WGS84 projection in the sync for WA cameras
4. **Add error logging per source** to identify which sources fail silently

### Phase 3: Add Missing Dedicated State Fetchers
For states where generic 511/ArcGIS sources fail, add dedicated API fetchers:

1. **Texas** — TxDOT has a REST API at `https://its.txdot.gov/ITS_WEB/FrontEnd/default.html` with camera data
2. **Ohio** — OHGO API at `https://publicapi.ohgo.com/api/v1/cameras`
3. **Georgia** — NaviGAtor API `https://navigator-atms.dot.ga.gov/`
4. **Virginia** — VDOT 511 API `https://www.511virginia.org/`
5. **Tennessee** — SmartWay `https://smartway.tn.gov/traffic`
6. **Colorado** — COtrip API `https://www.cotrip.org/`
7. **Arizona** — AZ511 API
8. **North Carolina** — NCDOT TIMS API
9. **Pennsylvania** — 511PA API
10. **New Jersey** — 511NJ + NJDOT TransHub
11. **Michigan** — Mi Drive API
12. **Minnesota** — MnDOT 511 API
13. **Indiana** — TrafficWise API

### Phase 4: Maximize Video Stream Coverage
For every source, attempt to extract or construct video URLs:

1. **Pattern-based URL construction** — Many DOTs follow predictable HLS patterns:
   - `https://{domain}/cameras/{id}/stream.m3u8`
   - `https://{domain}/cctv/{id}.mjpg`
2. **Probe for stream availability** — During sync, attempt HEAD requests on constructed stream URLs to verify
3. **Add stream URL columns** for sources that currently only store snapshots

### Phase 5: International Expansion
Windy API sources require a valid API key (currently expired). Additionally:

1. **Restore Windy API key** — covers 100+ global regions (Tokyo, London, Paris, etc.)
2. **Add TfL (London)** — dedicated JamCam API (~900 cameras)
3. **Add Japan JARTIC** — dedicated Japanese traffic camera API
4. **Add Canadian provinces** — Ontario 511, BC DriveBC, Alberta 511

---

## Expected Camera Counts After Full Integration

| Category | Current | Target |
|----------|---------|--------|
| **Total cameras** | 15,550 | 50,000+ |
| **With video stream** | 6,040 (39%) | 20,000+ (40%+) |
| **US states covered** | 7 | 50 |
| **FL cameras with video** | 0 | 2,220 |
| **International** | ~0 | 5,000+ |

### Implementation Priority
1. Florida video fix (immediate — biggest gap, 2,220 cameras with zero streams)
2. Fix WSDOT coordinates (1,653 cameras with broken locations)
3. Tier 1 state sources (13 major states, ~8,000+ new cameras)
4. Tier 2 + 3 states (~4,000+ new cameras)
5. Windy API restoration (international coverage)

