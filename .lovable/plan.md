

# Background Camera Recording System

## What You Want
A recording system where users can start recording any camera and it runs continuously (for hours, days, or indefinitely), capturing frames at the camera's native refresh rate. All frames are persisted to cloud storage so users can browse their full recording history anytime.

## Current State
- Recording already works but is tied to the browser tab -- if the user closes the popup or navigates away, the recording stops
- Frames are captured client-side via `setInterval` in `useRecordingSessions` store and uploaded to `camera-snapshots` bucket
- The `recording_sessions` and `camera_snapshots` tables already exist with user isolation (RLS)
- A 24-hour cleanup function (`cleanup_old_camera_snapshots`) deletes old snapshots automatically

## Plan

### 1. Remove the 24-hour cleanup constraint
- Drop or disable the `cleanup_old_camera_snapshots` function so historical recordings persist indefinitely
- Storage billing is already tiered (Basic/Standard/Premium) so users pay for what they use

### 2. Create a server-side recording edge function (`record-camera`)
- A new edge function that, when called, fetches one frame from a camera via the existing `proxy-camera-image` function, stores it in `camera-snapshots` bucket, and inserts a row into `camera_snapshots` table
- Accepts: `camera_id`, `image_url`, `user_id`, `session_id`
- This is the atomic "capture one frame" operation

### 3. Create a scheduled recording manager edge function (`recording-scheduler`)
- Runs every 10 seconds via `pg_cron`
- Queries `recording_sessions` for all sessions with `status = 'recording'`
- For each active session, checks if enough time has passed since the last snapshot (based on the camera's `refresh_rate`)
- If due, calls `record-camera` to capture a frame
- This makes recording **server-side** -- it continues even when the user closes their browser

### 4. Add `refresh_rate` column to `recording_sessions` table
- Store the camera's refresh rate so the scheduler knows the correct capture interval
- Migration: `ALTER TABLE recording_sessions ADD COLUMN refresh_rate integer DEFAULT 30`

### 5. Update `recording_sessions` table with duration controls
- Add `duration_mode` column: `'indefinite'` | `'timed'`
- Add `scheduled_stop_at` column (nullable timestamp) for timed recordings
- The scheduler auto-stops sessions that exceed their `scheduled_stop_at`

### 6. Update frontend recording controls
- **TrafficCameraPopup.tsx**: When user hits Record, show a duration picker (1h, 6h, 24h, 7d, indefinite)
- `startSession` in the store sends `refresh_rate` and `duration_mode` to DB
- Remove client-side `setInterval` capture loop -- recording is now fully server-side
- Keep client-side preview refresh for the live view (display only)

### 7. Update Recording Sessions Widget / Studio
- Show recording duration target (e.g., "Recording for 6h / indefinite")
- Show frame count and storage used (already exists)
- Add a "Recording History" section that lists all past sessions with frame counts
- Allow playback of any historical session by loading snapshots from `camera_snapshots` table (already implemented via `loadSessionSnapshots`)

### 8. Remove snapshot memory cap
- Current `maxSnapshots = 600` limit in `useCameraTimeline` only applies to the in-memory preview buffer
- For playback of historical sessions, paginate from DB (already done) -- no cap on persisted frames

## Technical Details

**New edge function: `record-camera/index.ts`**
- Fetches image via proxy, uploads to storage, inserts DB record
- Called by the scheduler, not by the client directly

**New edge function: `recording-scheduler/index.ts`**
- Scheduled via `pg_cron` every 10 seconds
- Queries active sessions joined with `camera_catalog` for refresh rates
- Batches captures for efficiency

**Database migration:**
```sql
ALTER TABLE recording_sessions 
  ADD COLUMN refresh_rate integer DEFAULT 30,
  ADD COLUMN duration_mode text DEFAULT 'indefinite',
  ADD COLUMN scheduled_stop_at timestamptz;
```

**Modified files:**
- `src/stores/useRecordingSessions.ts` -- remove client-side capture interval, add duration params to startSession
- `src/components/earth/TrafficCameraPopup.tsx` -- add duration picker UI
- `src/components/earth/RecordingSessionsWidget.tsx` -- show duration info
- `src/components/earth/MapCommandCenter.tsx` -- minor updates for new session fields
- `supabase/functions/record-camera/index.ts` -- new
- `supabase/functions/recording-scheduler/index.ts` -- new

