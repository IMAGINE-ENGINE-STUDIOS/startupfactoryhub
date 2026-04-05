

# Fix: Persistent Audio, Multi-Set Simultaneous Playback, Mic Auto-Record, Disc Direction Control

## Problems to Fix

1. **Deck sets interrupt each other** — `DJAudioEngine` only creates 2 audio elements (A/B) and syncs to `activeSet`. Switching sets stops previous audio.
2. **DJ deck stops when panel is hidden** — `HotDealsDJConsole` creates its own audio elements that get destroyed on unmount (`showDJ && <HotDealsDJConsole />`).
3. **Microphone doesn't auto-record** — User must manually click REC after activating mic.
4. **Disc drag doesn't start playback** — Dragging a stopped disc sets speed but doesn't trigger play.

## Solution

### 1. Multi-Set Simultaneous Playback in `DJAudioEngine.tsx`
The persistent engine (always mounted) needs to manage audio for ALL sets, not just the active one.

- Replace single `audioA`/`audioB` refs with a **Map of audio element pairs** keyed by set index
- On each `djState` update, iterate over `djState.sets[]` — for each set, create/reuse an audio pair, sync track URLs, play/pause state, crossfade, EQ
- When a set is removed, clean up its audio elements
- This ensures all sets play simultaneously regardless of which one the admin is viewing

### 2. Console Panel Audio is View-Only in `HotDealsDJConsole.tsx`
- Remove the audio playback logic from `HotDealsDJConsole` (lines ~304-456, 458-542) — the console should only control state via `broadcast()`, not play audio itself
- Keep only the `AudioContext` + analyser nodes needed for local visualization (spectrum, VU meters) by tapping into the audio elements from a shared ref or creating local analysers
- Actually, simpler approach: keep the console's own audio context for **visual analysis only** (spectrum/VU), but mark audio elements as `muted` so they don't double-play. The `DJAudioEngine` handles actual output.

### 3. Mic Auto-Record on Activate in `DJMicrophone.tsx`
- When `startMic()` succeeds, immediately call `startRecording(false)` — mic always records from the moment it's activated
- User can then toggle to "ANNOUNCEMENT" mode which broadcasts the live state
- Remove the separate REC button since recording is automatic

### 4. Disc Drag Starts Playback in `HotDealsDJConsole.tsx`
- In `DraggableVinyl.onPointerDown`: if the deck is not playing, call a callback to start it
- Add an `onStartPlay` prop to `DraggableVinyl`
- In the parent, wire it to `updateSet({ deckAPlaying: true })` / `deckBPlaying`
- On pointer move, the speed/direction already controls `playbackRate` and reverse simulation

### 5. Panel Hide Doesn't Stop Audio
- Since `DJAudioEngine` (always mounted) handles all playback, hiding the console panel just hides the UI — audio continues uninterrupted
- The console component no longer owns audio playback, only state + visualization

## File Changes

| File | Changes |
|------|---------|
| `src/components/dj/DJAudioEngine.tsx` | Support multiple simultaneous set audio pairs; iterate all `djState.sets[]` |
| `src/components/HotDealsDJConsole.tsx` | Remove audio playback (keep analysis-only context); add `onStartPlay` to DraggableVinyl; wire disc drag to start playback |
| `src/components/dj/DJMicrophone.tsx` | Auto-start recording when mic activates; remove manual REC button |

