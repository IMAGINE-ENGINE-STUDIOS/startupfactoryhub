

## Problem

Two issues:

1. **Stream cameras still record frame-by-frame**: When recording a stream camera, `startSession()` in `useRecordingSessions` always starts a background interval that fetches image snapshots via the proxy URL every N seconds (lines 223-290). This runs even for stream cameras where `useVideoRecorder` is also capturing via MediaRecorder. The result is frame-based snapshots instead of a proper video file.

2. **Recording button styling**: The current button uses a generic `Circle`/`Square` icon without clear red recording visual feedback.

## Plan

### 1. Skip frame capture for stream cameras in `useRecordingSessions.ts`

In `startSession()`, when the camera is a stream, skip the background `captureFrame` interval entirely. Add an `isStream` parameter to `startSession` and conditionally skip the interval + initial capture.

- Add `isStream?: boolean` to the `startSession` params
- Store `isStream` on the `RecordingSession` interface
- Wrap lines 288-290 (`captureFrame()` + `setInterval`) in `if (!isStream)` guard
- In `TrafficCameraPopup`, pass `isStream: hasStream` when calling `startSession`

### 2. Update recording button styling in `TrafficCameraPopup.tsx`

Replace the current `Circle`/`Square` icons at line ~232 with:
- **Not recording**: A red circle (`bg-red-500 rounded-full`) — the classic record dot
- **Recording**: A red square with pulsing animation
- Use explicit red coloring on the button itself (not just on active state)

### Files to modify:
- `src/stores/useRecordingSessions.ts` — add `isStream` param, skip frame capture for streams
- `src/components/earth/TrafficCameraPopup.tsx` — pass `isStream`, update button styling

