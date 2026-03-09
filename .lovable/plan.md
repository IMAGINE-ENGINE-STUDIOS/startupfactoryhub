

# Fix: Florida CCTV Cameras Not Showing Up

## Root Cause

The edge function has **fabricated API URLs** for Florida cameras that don't actually exist:
- `https://fl511.com/List/GetData/Cameras` -- does not exist
- `https://fl511.com/api/v2/cameras?format=json` -- does not exist  
- `https://fl511.com/map/mapIcons/Cameras` -- does not exist

These all fail silently (returning empty arrays), so zero Florida cameras ever show up.

The **real** FL511 camera data lives on an **ArcGIS FeatureServer** at:
```
https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0/query
```

I verified this endpoint works and returns real data with fields: `LATITUDE`, `LONGITUDE`, `IMAGE` (URL), `DESCRIPT`, `COUNTY`, `HIGHWAY`. There are 1,500+ cameras covering all of Florida (Orlando, Miami, Tampa, Naples, Cape Coral, etc.).

The Windy API (`fetchWindyCameras` and `fetchFloridaWindyCameras`) also returns 0 results -- the hardcoded API key `PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f` is likely invalid/expired or the response parsing is wrong.

## Plan

### File: `supabase/functions/traffic-cameras/index.ts`

**1. Replace `fetchFLDOT` with real ArcGIS endpoint**

Rewrite to query the actual ArcGIS FeatureServer with a spatial bounding box filter:
```
GET https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0/query
  ?where=1=1
  &geometry={west},{south},{east},{north}
  &geometryType=esriGeometryEnvelope
  &spatialRel=esriSpatialRelIntersects
  &outFields=ID,DESCRIPT,COUNTY,HIGHWAY,LATITUDE,LONGITUDE,IMAGE
  &f=json
  &resultRecordCount=500
```

Map response fields:
- `attributes.LATITUDE` / `attributes.LONGITUDE` for coordinates
- `attributes.IMAGE` for the camera image URL (filter out empty)
- `attributes.DESCRIPT` for name
- `attributes.COUNTY` + `attributes.HIGHWAY` as fallback name
- Source: `'FL511'`

**2. Remove `fetchFLSunGuide`** -- it uses the same fake FL511 URLs and is redundant once the ArcGIS endpoint covers all of Florida.

**3. Fix `fetchFloridaWindyCameras` and `fetchWindyCameras`** -- add `include=images,location` query parameter to the Windy API v3 URL, which is required to get image and location data in the response. Without it, the API returns minimal data without the `images` and `location` fields the code tries to parse.

**4. Redeploy** the edge function.

## Summary

| Change | Detail |
|--------|--------|
| Replace fake FL511 URLs | Use real ArcGIS FeatureServer with spatial query -- 1,500+ cameras |
| Remove redundant `fetchFLSunGuide` | Same broken URLs, now unnecessary |
| Fix Windy API queries | Add `include=images,location` parameter for proper response |
| Redeploy edge function | Automatic |

