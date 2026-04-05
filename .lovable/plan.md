

# Fix: DJ Console Crashes on Repeated Open/Close

## Root Cause

When the DJ panel is toggled via `showDJ`, `HotDealsDJConsole` unmounts and its cleanup runs:
- `audioCtxRef.current?.close()` — closes the `AudioContext`
- `audioARef.current?.pause()` — pauses audio elements

On re-mount, new `Audio()` elements are created, but `ensureAudioContext()` tries to call `ctx.createMediaElementSource()` on them. The problem is that after closing an `AudioContext`, it cannot be reused, and `createMediaElementSource()` can only be called once per element. After multiple open/close cycles, refs hold stale closed contexts and already-connected elements, causing silent failures or errors.

Additionally, the console creates its own audio playback chain that duplicates `DJAudioEngine`'s global playback — this was supposed to be "analysis only" but still plays audio, causing double-play issues.

## Plan

### 1. Fix `HotDealsDJConsole.tsx` — Reset refs properly on unmount
- In the cleanup function, after closing `AudioContext`, null out ALL refs (`audioCtxRef`, `gainARef`, `analyserARef`, etc.)
- This ensures `ensureAudioContext()` creates a fresh chain on re-mount instead of skipping because a closed context exists
- Also null out `audioARef` and `audioBRef` so new `Audio()` elements are created

### 2. Make console audio muted (visualization only)
- The console's audio elements should be `muted = true` since `DJAudioEngine` handles actual playback for all users
- This prevents double audio and ensures hiding/showing the panel never interrupts the global stream
- Keep the `AudioContext` + analyser chain so spectrum/VU visualizations work (analysers work on muted elements)

### 3. Ensure `DJAudioEngine` (in `App.tsx`) is the sole audio source
- `DJAudioEngine` is already globally mounted and handles all broadcast state — no changes needed there
- Non-admin users already hear everything through `DJAudioEngine` — music, announcements, all in real-time

## Files Changed

| File | Change |
|------|--------|
| `src/components/HotDealsDJConsole.tsx` | Null out all audio refs on unmount; set console audio elements to `muted = true`; ensure `ensureAudioContext` always creates fresh context after previous was closed |

