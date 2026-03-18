
Goal: make Florida cameras behave like NYC (reliable fresh frames first, green only for truly real-time streams), and remove coverage gaps.

What is actually broken right now (confirmed):
1) Stream misclassification: all FL cameras are marked as stream (green) because `stream_url` is always set; many FL `GetVideo` URLs return a single image frame payload, not a continuous stream.
2) Wrong FL URL key: `fetchFLDOT` builds FL URLs from `ID` (non-unique), while IDs repeat across counties. Result: wrong/repeated feeds and many “frozen-looking” cameras.
3) Pagination skip bug (major coverage loss): frontend and edge function use page size 2000, but returned pages cap at 1000; cursor jumps by 2000, skipping blocks of cameras.
4) Fallback fragility: `proxy-camera-image` currently returns 404 when called directly, so stream fallback to image mode can fail hard.
5) Refresh-rate logic is hardcoded by source, not measured from actual frame-change cadence.

Implementation plan

Phase 1 — Stabilize behavior to NYC-like reliability (highest priority)
- `supabase/functions/sync-cameras/index.ts`
  - Stop force-tagging all FL cameras as stream.
  - Build FL camera image URL from unique camera key (OBJECTID-based mapping), not repeating `ID` mapping.
  - Keep FL as snapshot-first until stream is explicitly verified.
- `src/components/earth/TrafficCameraPopup.tsx`
  - Treat FL as image-refresh mode by default unless stream is verified.
  - Tighten stream detection (no generic “video” keyword inference for FL).
  - Keep auto-fallback from stream to image mode.
- `src/components/GlobalResourcesMap.tsx`
  - Green marker only when feed is verified stream, not merely when `streamUrl` exists.

Phase 2 — Fix missing Florida coverage on map
- `supabase/functions/traffic-cameras/index.ts`
  - Set safe page size to 1000 (or dynamic from actual returned row count).
  - Compute `nextCursor` from actual returned count to prevent skipped ranges.
- `src/hooks/useTrafficCameras.ts`
  - Align client pagination to 1000 and cursor progression by returned rows.
- Re-run FL replace sync after changes so map reflects corrected feed IDs and metadata.

Phase 3 — Source-specific freshness/rate calibration
- Add feed probing pass in sync pipeline:
  - Sample camera URLs per source, fetch with cache-busters at intervals, compare hashes/timestamps.
  - Persist measured cadence and feed type (`snapshot`, `mjpeg_stream`, `video_stream`, `dead`).
- Use measured cadence to set `refresh_rate` per source/camera (instead of blanket FL=2).
- Keep NYC parity target: prioritize consistent frame updates over “green” labels.

Phase 4 — Stream verification and hardening
- Stream verification gate:
  - Mark stream only if response characteristics prove true stream (multipart/video behavior).
  - Otherwise keep snapshot mode (red) even if URL looks like “GetVideo”.
- Proxy resilience:
  - Ensure `proxy-camera-image` is deployed and reachable.
  - Add frontend fallback to direct image URL if proxy fails, so feed never blanks.
- Sync observability:
  - Expand `camera_sync_status` with per-source inserted/updated/skipped/error/probed counts.

Technical details (for implementation)
- Files to change:
  - `supabase/functions/sync-cameras/index.ts`
  - `supabase/functions/traffic-cameras/index.ts`
  - `src/hooks/useTrafficCameras.ts`
  - `src/components/earth/TrafficCameraPopup.tsx`
  - `src/components/GlobalResourcesMap.tsx`
- Optional DB additions (recommended): `feed_type`, `stream_verified`, `measured_refresh_ms`, `last_probe_at`, `last_probe_error`.

Acceptance checks (must pass)
1) Full Florida bounds request returns complete set without skipped blocks (no pagination holes).
2) City coverage restored (South FL + Orlando/Tampa/Lake/Polk/North FL counts visibly increase in viewport).
3) No “frozen green” cameras: green appears only on verified real-time feeds.
4) Snapshot cameras visibly advance frames over time at measured cadence (NYC-like behavior).
5) Stream failure always degrades gracefully to refreshing snapshots (no blank/unavailable loop).
