

## Problem

Recording sessions are never saved to the database because `startSession()` in `TrafficCameraPopup.tsx` is called **without passing `userId`**. The store's `startSession` method has a guard `if (userId)` that skips the DB insert when `userId` is undefined. This is why the `recording_sessions` table is empty and sessions disappear on reload.

## Fix

**1. Pass `userId` when starting a session** (`TrafficCameraPopup.tsx`)
- Import `useAuth` from `@/contexts/AuthContext`
- Get `user` from the hook
- Pass `userId: user?.id` in the `startSession()` call

**2. Also pass `userId` to snapshot persistence** — the `captureFrame` function in the store already handles `userId` for `increment_storage_usage`, but the snapshots themselves are only kept in memory (object URLs). We need to also persist snapshot images to Supabase Storage during recording so they survive page reload.

**3. Persist snapshots to Supabase Storage** (`useRecordingSessions.ts`)
- In the `captureFrame` function, after fetching the blob, upload it to the `camera-snapshots` bucket under the session's `storagePath`
- Insert a row into `camera_snapshots` table with `camera_id`, `storage_path`, `captured_at`, and `user_id`
- This ensures `loadSessionSnapshots` can retrieve them later from the DB

**4. Ensure `loadSessionSnapshots` works with `user_id` filtering** — currently it queries by `camera_id` + time range, which is correct but should also filter by `user_id` for security.

### Files to modify
1. `src/components/earth/TrafficCameraPopup.tsx` — add `useAuth`, pass `userId: user?.id` to `startSession`
2. `src/stores/useRecordingSessions.ts` — in `captureFrame`, upload blob to Supabase Storage and insert into `camera_snapshots` table

This is a small but critical fix — the entire persistence pipeline was silently disabled because of a missing parameter.

