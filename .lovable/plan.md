

# Fix: Persistent Audio & Smooth Live Announcements

## Problems

1. **Live announcements cut/stutter**: `DJAudioEngine` plays each 200ms chunk as a separate `new Audio()` element. Each chunk must independently decode and start, causing gaps and stuttering between chunks.

2. **Everything stops when admin hides DJ panel**: `HotDealsDJConsole` (including `DJMicrophone`) is conditionally rendered with `{showDJ && ...}`. When hidden, the component unmounts, killing the mic stream and stopping any active announcement broadcast. Music also stops because the console's audio context is destroyed.

## Solution

### 1. Move `DJMicrophone` to always-mounted location
- Extract `DJMicrophone` out of `HotDealsDJConsole` and mount it directly in `HotDealsPortal.tsx` (or alongside `DJAudioEngine` in App) so it persists regardless of the DJ panel visibility.
- Only render it for admin users. It will manage its own `AudioContext` (it already has `ownCtxRef` fallback).
- The DJ console UI will show mic controls via a shared state/ref pattern, or we simply always render `DJMicrophone` outside the `{showDJ && ...}` conditional but visually hide it when the panel is closed.

### 2. Fix announcement audio playback — use `MediaSource` buffering
- Replace the current approach in `DJAudioEngine` (creating a new `Audio()` per chunk) with a single persistent `Audio` element fed by a `MediaSource` + `SourceBuffer`. Each incoming base64 chunk is appended to the buffer, giving seamless gapless playback.
- Fallback: if `MediaSource` is not supported, queue chunks and play them sequentially with overlap to minimize gaps.

### 3. Ensure DJ console hide/show doesn't kill music
- The previous fix already made console audio elements `muted = true` for visualization only, with `DJAudioEngine` handling real playback. Verify this is working — if the console still creates unmuted audio elements, fix them.
- Confirm the console cleanup does NOT broadcast pause/stop state when merely hiding the UI.

## File Changes

| File | Changes |
|------|---------|
| `src/pages/HotDealsPortal.tsx` | Move `DJMicrophone` outside `{showDJ && ...}` block — render it always (admin-gated internally) so mic/announcements persist |
| `src/components/HotDealsDJConsole.tsx` | Remove `DJMicrophone` from inside the console; remove cleanup that broadcasts stop state on unmount |
| `src/components/dj/DJMicrophone.tsx` | Add a `hidden` or `minimized` prop so it can render invisibly; ensure it always uses its own `AudioContext` when external is null; fix the unmount cleanup to NOT kill the stream if announcement is active |
| `src/components/dj/DJAudioEngine.tsx` | Replace per-chunk `new Audio()` with a `MediaSource` + `SourceBuffer` approach for gapless announcement playback; add queue fallback for browsers without `MediaSource` support |

