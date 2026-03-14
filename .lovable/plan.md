
Goal: make camera coverage reliable for the requested regions (Hawaii, Texas, Colorado, Las Vegas/NV, Chicago/Illinois, Tennessee, Kentucky, Japan/Tokyo, Europe) and support full video-camera tools in the same UI.

What I found in current code
- Current `traffic-cameras` function does live fan-out to many public endpoints on every viewport request, then returns a single large payload (no paging).
- Several configured sources are stale/invalid/blocked (examples I verified):  
  - TX ArcGIS URL returns `Invalid URL`  
  - KY 511 API paths return `404`  
  - NJ 511 API returns `403 Access Denied`  
  - IL uses an ArcGIS Hub dataset URL instead of the actual FeatureServer endpoint.
- Live probes show coverage is currently uneven: CA/NY/FL return many cameras, while multiple requested regions return empty results.
- This architecture is brittle for “all cameras in viewport/worldwide” because one-shot live aggregation + timeouts causes gaps.

Implementation plan
1) Build source health + coverage audit
- Add per-source diagnostics (count, last success, last error, latency).
- Produce a “missing coverage” report by state/city/country so we can definitively identify failing regions instead of guessing.

2) Move to resumable ingestion (not per-request live scraping)
- Create persistent camera catalog tables (`camera_catalog`, `camera_sources`, `sync_status`).
- Implement resumable paginated sync edge function (cursor + `hasMore/nextCursor`) to ingest one page at a time and continue until complete.
- Add short inter-page delay to avoid source rate limits.

3) Refactor viewport API to query catalog
- `traffic-cameras` should read from `camera_catalog` by bounds, with pagination (`hasMore`, `nextCursor`, total count).
- Keep cameras visible immediately from DB results; validation/status updates run asynchronously.

4) Fix/replace broken regional sources (priority list from your request)
- Replace invalid IL/TX endpoints with working official API resources.
- Rewire HI/TN/CO/NV/KY integrations to current supported endpoints.
- Add explicit adapters for Japan/Tokyo and Europe providers (public/legal sources), plus fallback global providers.

5) Client loading reliability improvements
- Update `useTrafficCameras` to fetch paginated viewport results in a loop and merge pages without clearing already-loaded markers.
- Keep marker rendering stable across pan/zoom; avoid “only appears after moving” behavior.
- Add loading progress indicator (loaded vs total in viewport).

6) Video feed parity
- Ensure every camera with `streamUrl` uses the same popup toolset (live playback, timeline scrub, recording, Studio persistence).
- Add HLS fallback support where browser native playback is insufficient.
- Normalize stream detection/parsing per source so video cameras are consistently flagged.

Technical details (implementation shape)
```text
[Source adapters] -> [sync-cameras-page edge fn, cursor-based] -> [camera_catalog DB]
                                                    |
                                                    v
                                           [source health metrics]

Map viewport -> [traffic-cameras edge fn: DB bounds query + pagination]
             -> client merges pages progressively
             -> popup uses unified video+recording timeline tools
```

Files/components to update
- `supabase/functions/traffic-cameras/index.ts` (refactor to DB query mode + diagnostics)
- New edge function for sync pagination (e.g. `supabase/functions/sync-cameras-page/index.ts`)
- New Supabase migration(s) for catalog/source/sync tables + indexes + RLS
- `src/hooks/useTrafficCameras.ts` (paged fetch loop + progressive merge)
- `src/components/GlobalResourcesMap.tsx` (loading/count UX + large-volume marker handling)
- `src/components/earth/TrafficCameraPopup.tsx` and `src/hooks/useCameraTimeline.ts` (video parity hardening)

Acceptance criteria
- Requested regions return non-empty cameras when valid sources exist.
- All cameras in viewport are returned without requiring extra pan/zoom.
- Video cameras expose playback + recording + time travel consistently.
- Coverage health dashboard identifies failing sources/states automatically.
