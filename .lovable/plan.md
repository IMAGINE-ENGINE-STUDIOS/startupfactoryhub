

# DJ Console Enhancements: Larger Discs, Instrument Recording, Loop/Pitch Controls, Live Announcements

## Summary
Enlarge DJ vinyl discs, add record button + loop/pitch controls to instruments, fix microphone recording (audio cutting), and add a "LIVE ANNOUNCEMENT" mode that broadcasts mic audio to all users in real-time.

## Changes

### 1. Enlarge DJ Vinyl Discs
**File: `src/components/HotDealsDJConsole.tsx`** (DraggableVinyl component)
- Increase disc size from `w-28 h-28 sm:w-36 sm:h-36` to `w-40 h-40 sm:w-48 sm:h-48`
- Scale center label and platter rim proportionally

### 2. Add Record Button to Instruments
**File: `src/components/dj/DJDrumMachine.tsx`**
- Add a REC button that captures drum pad output into a `MediaRecorder` via `createMediaStreamDestination()`
- Show recording timer and save/download button
- Add loop toggle: records a pattern and plays it back in a loop

**File: `src/components/dj/DJSynthesizer.tsx`**
- Add a REC button to capture synth performances
- Add loop and pitch transpose controls (+/- octave buttons)
- Add sustain/hold toggle for drone-style playing

### 3. Fix Microphone Recording (Audio Cutting)
**File: `src/components/dj/DJMicrophone.tsx`**
- Problem: `MediaRecorder` is created with `streamRef.current` but `start()` is called without `timeslice`, meaning `ondataavailable` only fires on stop. If the stream gets interrupted, data is lost.
- Fix: Call `recorder.start(250)` to capture data in 250ms chunks — prevents audio cutting
- Also increase `getUserMedia` constraints: add `autoGainControl: true`, `sampleRate: 48000` for higher quality
- Add a gain slider for mic input level control

### 4. Live Announcement Mode (Heard by ALL Users)
**File: `src/components/dj/DJMicrophone.tsx`**
- Add an "ANNOUNCEMENT" toggle button (separate from regular mic recording)
- When ANNOUNCEMENT is active:
  - Broadcast `mic-state: { micActive: true, announcementLive: true }` via Supabase Realtime
  - The mic audio is already routed to `masterGainRef` → it plays through the DJ audio chain locally
  - For remote users: since raw audio can't stream via Supabase Realtime, the announcement records continuously and on stop, auto-saves with `recording_type: 'announcement'`
  - All users see a prominent "LIVE ANNOUNCEMENT" banner with pulsing indicator
  - Broadcast state includes `announcementLive: true` so `DJAudioEngine` and all clients show the live indicator

**File: `src/components/HotDealsDJConsole.tsx`**
- Show "LIVE ANNOUNCEMENT" banner when broadcast state includes announcement active
- Pass `announcementLive` state down

**File: `src/components/dj/DJAudioEngine.tsx`**
- Listen for `mic-state` broadcast events on the `hot-deals-dj-control` channel
- When `announcementLive: true` is received, show a global LIVE indicator (optional: play a notification sound)

### 5. Add Loop & Pitch Controls to Instruments

**DJDrumMachine additions:**
- Loop button: when enabled, records pad hits over a 4-beat/8-beat interval, then replays them in a loop using `setInterval` tied to BPM
- Clear loop button
- Tempo/BPM selector for the loop (60-180 BPM)

**DJSynthesizer additions:**
- Octave selector (+/- buttons, default octave 4)
- Arpeggiator toggle (cycles through held notes automatically)
- Pitch bend wheel (small vertical slider)

## Files Summary

| File | Action |
|------|--------|
| `src/components/HotDealsDJConsole.tsx` | Enlarge discs, add announcement banner, pass announcement state |
| `src/components/dj/DJMicrophone.tsx` | Fix recording chunks, add gain slider, add ANNOUNCEMENT mode with auto-save |
| `src/components/dj/DJDrumMachine.tsx` | Add REC button, loop recorder, BPM selector |
| `src/components/dj/DJSynthesizer.tsx` | Add REC button, octave selector, pitch controls |
| `src/components/dj/DJAudioEngine.tsx` | Listen for announcement broadcast, show live indicator |

