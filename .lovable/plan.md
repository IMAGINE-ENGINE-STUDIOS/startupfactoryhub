

## Assessment: Traffic Camera System — State-by-State Audit

### What's Working
The logs confirm the edge function runs without errors and returns cameras for **FL** (up to 1246), **NYC** (1034-1273), and **Windy** (worldwide). The client-side viewport-clearing and feed validation queue are functioning correctly.

### Root Cause of "No Loading" for Many States
Most of the 50-state "coverage" uses **guessed 511 URLs** that don't actually host the standard `/api/v2/get/cameras` endpoint. The `fetch511Cameras` helper silently fails (returns `[]`) after trying 3 URL patterns, each with a 10s timeout — meaning **30 seconds wasted per broken state**. With ~20 broken states, that's 10+ minutes of wasted fetch time within `Promise.allSettled`, though it doesn't block other sources.

### State-by-State Breakdown

**Confirmed Working (real APIs with known schemas):**
CA (Caltrans ArcGIS), FL (ArcGIS), WA (WSDOT ArcGIS), TX (TxDOT ArcGIS + Austin Socrata), NYC (NYCTMC API), NY (511ny.org - real 511), NJ (511nj.org - real 511), PA (511pa.com - real 511), Windy (worldwide)

**Likely Working (real 511 platforms):**
IA (511ia.org), AZ (az511.gov), NE (511.nebraska.gov), NV (nvroads.com), WI (511wi.gov), UT (udottraffic.utah.gov), SC (511sc.org), KY (511.ky.gov), LA (511la.org), AK (511.alaska.gov), ID (511.idaho.gov)

**Likely Broken — Wrong URLs (not 511 platforms):**
- **MI**: `mi.gov/drive` — not a 511 API (should be `https://mdotjboss.state.mi.us/MiDrive`)  
- **IN**: `indot.carsprogram.org` — not a public 511 API  
- **AL**: `algotraffic.com` — custom site, not 511 API  
- **OK**: `ok.gov/odot` — general DOT site  
- **KS**: `kandrive.org` — custom site, not standard 511  
- **AR**: `idrivearkansas.com` — custom site  
- **MS**: `mdottraffic.com` — custom site  
- **DE**: `deldot.gov` — general DOT site  
- **RI**: `dot.ri.gov` — general DOT site  
- **HI**: `goakamai.org` — custom site  
- **MO**: `traveler.modot.org` — custom, may have different API  
- **WV**: `wv511.org` — may work but unverified  

**Likely Broken — Custom APIs needing different parsers:**
- **MD**: `chart.maryland.gov/DataFeeds/GetCamerasJson` — URL format likely wrong
- **TN**: `smartway.tn.gov/traffic/api/Cameras` — may need auth or different path  
- **CO**: `cotrip.org/speed/getTrafficCameras.do` — likely moved/deprecated  
- **OR**: `tripcheck.com/Scripts/map/data/cameraData.js` — JS file, not JSON  
- **IL**: ArcGIS URL may be wrong (uses opendata gateway, not direct FeatureServer)  
- **VA**: `511virginia.org/data/geojson/icons.cameras.geojson` — may be deprecated  
- **GA**: `511ga.org/api/v2` — may work  
- **NC**: `tims.ncdot.gov` — likely not standard 511  

**New England shared URL (`newengland511.org`):**
- **NH, VT, ME**: All point to same domain — may return all NE cameras, causing duplicates or none if API doesn't exist

**DC**: ArcGIS URL may be wrong (MapServer vs FeatureServer)

### Plan

#### 1. Replace broken 511 URLs with verified ArcGIS endpoints (~15 states)
Many state DOTs publish camera data through ArcGIS Online or their own GIS servers. Replace the guessed 511 URLs with real ArcGIS FeatureServer queries for:
- **MI**: MDOT GIS services
- **IN**: INDOT GIS  
- **AL**: ALDOT GIS
- **MO**: MoDOT GIS
- **CO**: CDOT ArcGIS (replace broken cotrip URL)
- **OR**: ODOT GIS (replace tripcheck JS)
- **TN**: TDOT GIS (replace smartway)
- **MD**: MDSHA ArcGIS (replace chart.maryland)
- **NC**: NCDOT GIS
- **VA**: VDOT GIS (replace geojson)

#### 2. Fix or remove non-functional fetchers (~10 states)
For states without known public camera APIs (OK, KS, AR, MS, DE, RI, HI, WV, NM), either:
- Find and integrate their actual public API/ArcGIS endpoints
- Remove the broken fetcher to avoid wasted timeouts

#### 3. Reduce timeout waste
Change the per-URL timeout in `fetch511Cameras` from 10s to 5s (3 URLs × 5s = 15s max waste per broken state instead of 30s).

#### 4. Add error logging per source
Add `console.log` for each source that returns 0 cameras or errors, so we can monitor which sources are actually working in production.

### Files to Change
- `supabase/functions/traffic-cameras/index.ts` — Replace ~20 broken fetchers with verified endpoints, reduce timeouts, add per-source logging

