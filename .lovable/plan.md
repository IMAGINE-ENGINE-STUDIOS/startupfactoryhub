

## Plan: Adaptive Camera Refresh Rates and Live Video Streams

### Problem
- All cameras refresh at a fixed 5s interval regardless of source
- Cameras with actual video/stream URLs (MJPEG, HLS) display as static images instead of live video

### Changes

#### 1. Extend TrafficCamera interface (`src/hooks/useTrafficCameras.ts`)
Add two optional fields:
- `streamUrl?: string` — for cameras that provide MJPEG/HLS/video streams
- `refreshRate?: number` — source-specific refresh interval in seconds (5-30)

#### 2. Update edge function to return stream URLs and refresh rates (`supabase/functions/traffic-cameras/index.ts`)
- Each source fetch function will include a `refreshRate` in the returned camera objects based on the source's known update frequency:
  - NYC DOT, WSDOT: 5s (fast refresh)
  - FL511, Caltrans, 511VA: 10-15s
  - Windy, UK, NL, AU: 20-30s
- For 511NY and NYCDOT, extract `VideoUrl` / `streamUrl` fields when available and return them as `streamUrl`
- The `CameraResult` interface gets `streamUrl?: string` and `refreshRate?: number`

#### 3. Update TrafficCameraPopup to support video and adaptive refresh (`src/components/earth/TrafficCameraPopup.tsx`)
- **Video detection**: If `camera.streamUrl` exists and ends in `.m3u8`, `.mjpg`, `.mjpeg`, `.mp4`, or is an MJPEG endpoint, render a `<video>` or `<iframe>` element instead of `<img>`
- **Adaptive refresh**: Use `camera.refreshRate` (default 10s) for the `setInterval` duration instead of hardcoded 5s
- **UI indicator**: Show actual refresh rate in the overlay badge (e.g., "10s refresh" instead of always "5s refresh")
- For video streams, hide the refresh countdown and show a "STREAMING" badge instead of "LIVE"

#### 4. Proxy updates (`supabase/functions/proxy-camera-image/index.ts`)
- No changes needed — video streams will be loaded directly (not through the image proxy) since they're continuous connections

### Technical Details

**Refresh rate mapping by source:**
```text
Source          | Refresh Rate | Stream Support
----------------|-------------|---------------
NYCDOT          | 5s          | Yes (MJPEG)
511NY           | 5s          | Yes (VideoUrl)
Caltrans        | 10s         | No
WSDOT           | 5s          | No
FL511           | 15s         | No
511VA           | 15s         | No
Windy           | 30s         | No
UK/NL/AU        | 20-30s      | No
```

**Video rendering approach:**
- MJPEG streams: `<img>` tag pointing directly at MJPEG URL (browsers render these natively as video)
- HLS (.m3u8): Not feasible without a library — fall back to snapshot refresh
- Direct video URLs (.mp4): `<video>` tag with autoplay, muted, loop

**Files to modify:**
- `src/hooks/useTrafficCameras.ts` — extend interface
- `supabase/functions/traffic-cameras/index.ts` — add refreshRate + streamUrl to each source
- `src/components/earth/TrafficCameraPopup.tsx` — adaptive refresh + video rendering

