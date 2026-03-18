
Goal: fix Florida camera feed failures, recover missing Florida city coverage, and close gaps from the previous implementation.

What I found (from code + DB + live source checks):
1) Florida cameras are being collapsed by non-unique IDs.
- In `supabase/functions/sync-cameras/index.ts` (`fetchFLDOT`), camera ID is currently `fl-${ID}`.
- FL ArcGIS has `count=4627`, but only `distinct ID=2979`; many IDs repeat across different cameras/counties.
- Example: `ID=643` maps to 6 different cameras in different counties.
- Result: rows overwrite each other in `camera_catalog`, causing missing city coverage (especially South FL metro density).

2) Stream URLs for FL are being force-constructed and often misclassified as true video.
- Current FL stream logic sets `stream_url = https://fl511.com/map/Cctv/GetVideo/{ID}`.
- Frontend treats URLs containing “video” as stream and renders `<video>`.
- Many FL “GetVideo” responses behave like image/mjpeg payloads, so `<video>` fails and user sees no feed.

3) Previous implementation gaps still present:
- `FL-511-API` path is not actually usable as coded (`Invalid Key` / DataTables payload with empty `data` unless special paging params).
- Sync pipeline does not validate `upsert` errors (`await upsert(...)` result is ignored), so partial/failed writes can be silently marked as success.
- Source replacement strategy is missing (no stale-row cleanup per source), so bad old rows can persist.

4) Coverage reality vs user report:
- Florida data in DB exists but is reduced and misdistributed due ID collisions.
- South FL city-center density is still weak (e.g., Miami/Miami Beach core), so additional county/city sources are needed after FL511 fix.

Implementation plan:
Phase 1 — Fix Florida identity + feed classification (highest priority)
- File: `supabase/functions/sync-cameras/index.ts`
1. In `fetchFLDOT`, switch primary camera key from `ID` to `OBJECTID_1` (unique ArcGIS object id).
   - Keep FL511 `ID` as separate source field for metadata/use in fallback URL construction.
2. Stop force-trusting `GetVideo/{ID}` as stream for all cameras.
   - Populate `stream_url` only when field evidence is explicit and valid.
   - Keep `image_url` as primary playable feed for FL unless stream is verified.
3. Add FL-specific dedupe before upsert by final `id`.
4. Enforce upsert error handling:
   - Capture `{ error }` from each upsert chunk and `throw` on failure.
   - Persist real failure in `camera_sync_status.last_error`.

Phase 2 — Make FL feeds always render (no “NON”/blank popup)
- File: `src/components/earth/TrafficCameraPopup.tsx` (and optionally helper logic)
1. Harden stream detection:
   - Do not treat generic `...GetVideo/...` as guaranteed `<video>` source.
2. Add FL fallback behavior:
   - If stream playback fails quickly, auto-fallback to image mode (proxy snapshot path), instead of “feed unavailable”.
3. Keep recording behavior aligned:
   - If feed is fallback-image mode, record as frame timeline.
   - If true video stream exists, use MediaRecorder path.

Phase 3 — Recover missing Florida city coverage
- File: `supabase/functions/sync-cameras/index.ts`
1. Source reconciliation:
   - Run FL source in “replace mode” (delete/reload FL511 rows) after ID fix to avoid mixed old/new IDs.
2. Add missing high-density South/Central/North FL feeds from dedicated providers:
   - Miami-Dade, Broward, Orlando metro/Turnpike-adjacent, Tampa area, and North FL regional feeds.
3. Add source-level metrics:
   - Track per-source inserted/updated/skipped/error counts in `camera_sync_status` to detect regressions immediately.

Phase 4 — “Missing from previous implementation” hardening
- File: `supabase/functions/sync-cameras/index.ts`
1. Add version stamp to sync runs (e.g., `sync_version`) to confirm deployed code is the code being executed.
2. Fix FL API adapter or remove it until real endpoint contract is confirmed.
3. Add validation guardrails:
   - Reject invalid URLs.
   - Detect duplicate IDs per source before DB writes and log count.
   - Mark suspect stream endpoints for fallback classification.

Technical details (concise):
- Primary bug: identifier collision (`ID` not unique) => overwritten rows => missing city cameras.
- Secondary bug: stream misclassification (`GetVideo` inferred as video) => `<video>` element failure.
- Operational bug: ignored upsert errors => false-positive sync success.
- Data impact expected after Phase 1:
  - FL rows should increase substantially from current collapsed set.
  - South FL/Orlando/Tampa/North FL marker density should rise immediately.
  - FL popups should show feed reliably via correct mode (video when valid, otherwise image fallback).

Validation checklist (must pass):
1. DB validation:
- `camera_catalog` FL row count increases after re-sync.
- No duplicate collapse from reused FL `ID`.
2. Geographic validation:
- Cameras visible in Miami, Miami Beach, Coral Gables, Kendall, Hollywood, Pembroke Pines, Ft Lauderdale, Pompano, Orlando, Tampa, Lake/Polk, North FL.
3. Feed validation:
- Opening random FL cameras no longer shows blank “unavailable” due stream misclassification.
4. End-to-end:
- Toggle CCTV on map, open 20+ FL cameras across regions, verify marker visibility + feed rendering + recording mode behavior.
