
# DJ Console: Full Speed Control, Headphone Cue, Record, Drums & Synth

## 1. Disc Bidirectional Speed Control
**Current:** Disc scratch only temporarily changes playbackRate, then snaps back to 1x after 150ms.
**Change:** Make disc rotation **persistently** control playback speed and direction:
- Dragging clockwise = forward (0.1x to 3x speed based on drag velocity)
- Dragging counter-clockwise = reverse simulation (playbackRate near 0 + visual reverse)
- Holding disc still = pause/stop the track
- Release disc = smoothly return to 1x normal speed
- Add a **speed display** under each deck showing current rate (e.g., "-2x", "0.5x", "STOP")
- Add **pitch fader** (-8% to +8%) per deck for fine speed adjustment

## 2. Headphone Pre-Listen (Cue)
- Add a **CUE button** per deck that routes that deck's audio to headphones only (not main output)
- Uses Web Audio API: split routing so cue goes to a separate output (or uses the split-channel technique)
- Visual: headphone icon button per deck, glows when active
- Allows testing/previewing a track before mixing it live

## 3. Record Function
- Add a **REC button** that captures the mixed audio output using `MediaRecorder` + `MediaStreamDestination`
- Shows recording duration timer with red pulsing indicator
- Stop recording → generates downloadable WAV/WebM file
- Visual: Classic red record button with LED

## 4. Digital Drum Machine
- **8-pad drum grid** (kick, snare, hi-hat, clap, tom, cymbal, fx1, fx2)
- Each pad triggers a short audio sample using Web Audio API `AudioBufferSourceNode`
- Samples generated via oscillator synthesis (no external files needed):
  - Kick: low sine sweep
  - Snare: noise burst + tone
  - Hi-hat: filtered noise
  - Clap: layered noise bursts
- Optional: simple 16-step sequencer pattern that auto-plays with BPM

## 5. Synthesizer with Presets
- **Piano-style keyboard** (1 octave, 12 keys) using Web Audio API oscillators
- **Preset selector** with 8+ presets:
  - Sine Lead, Square Bass, Saw Pad, FM Bell, Pluck, Sub Bass, Strings, Sci-Fi
- Each preset configures: oscillator type, ADSR envelope, filter cutoff, detune
- **Controls:** Filter cutoff knob, resonance, attack/release sliders
- Notes play through the main audio chain so all users hear them (via broadcast of note events)

## Architecture
- All new instruments (drums, synth) use **Web Audio API oscillator synthesis** — no external audio files
- Admin controls broadcast note/drum triggers via Supabase realtime so all users hear them
- New sub-components to keep file manageable:
  - `DJSpeedControl.tsx` — speed display + pitch fader per deck  
  - `DJDrumMachine.tsx` — 8-pad drum grid with synthesis
  - `DJSynthesizer.tsx` — keyboard + presets
- Record feature integrated into main `HotDealsDJConsole.tsx`

## Files
| File | Action |
|------|--------|
| `src/components/HotDealsDJConsole.tsx` | Update disc behavior, add cue/record buttons, integrate new sub-components |
| `src/components/dj/DJDrumMachine.tsx` | New — 8-pad drum machine with oscillator synthesis |
| `src/components/dj/DJSynthesizer.tsx` | New — 1-octave keyboard synth with presets |
| `src/hooks/useDJBroadcast.ts` | No changes needed (drum/synth triggers are local audio, disc speed is local) |
