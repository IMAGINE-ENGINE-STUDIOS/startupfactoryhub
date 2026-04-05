

# Interactive DJ Console for Hot Deals Radio Station

## Overview

Build a 2D interactive DJ console component inspired by the Pioneer CDJ reference image. The console replaces the simple "RADIO" toggle button with a full DJ display panel. Admin users (demo-admin@startupfactoryhub.com, ceo@imagineengine.space) can control volume, track selection, and audio effects — all changes broadcast in real-time to every user on the portal via Supabase Realtime channels.

## Architecture

```text
┌─────────────────────────────────────────────┐
│            SUPABASE REALTIME CHANNEL        │
│         "hot-deals-dj-{broadcast}"          │
│                                             │
│  Admin sends:  { volume, track, effects }   │
│  All users receive: same state, apply it    │
└──────────┬──────────────────┬───────────────┘
           │                  │
     ┌─────▼─────┐    ┌──────▼──────┐
     │  Admin UI  │    │  Viewer UI  │
     │ (controls) │    │ (read-only) │
     └────────────┘    └─────────────┘
```

## DJ Console UI Design (Pure CSS/SVG — no images)

The console is a dark panel with orange/red accents matching the Hot Wheels theme:

- **Two turntable platters** — CSS circles with rotating groove lines (animated when playing)
- **Center mixer section** with:
  - Volume slider (vertical fader)
  - Track selector dropdown (preset tracks/streams)
  - BPM display
  - Play/Pause button
- **Effects strip** — 3-4 toggle buttons: Bass Boost, Echo, Reverb, Speed
- **VU meter** — animated vertical bars reacting to playback state
- **"ON AIR" indicator** — glowing red when streaming

Admin sees all controls interactive. Non-admin users see the same console but controls are disabled/locked — they just see the current state updating live.

## Track List (Preset Streams/Tracks)

Hardcoded list of royalty-free streams/URLs:
1. Current Zeno.fm stream (default)
2. 2-3 additional free streams or placeholder URLs the admin can swap later

## Real-Time Sync via Supabase Realtime Broadcast

Use Supabase Realtime **broadcast** (not presence) for lightweight state sync:

- Channel: `hot-deals-dj-control`
- Admin broadcasts a `dj-state` event on every control change: `{ volume: 0-100, trackIndex: number, isPlaying: boolean, effects: { bass: bool, echo: bool, reverb: bool, speed: number } }`
- All connected users listen and apply the state to their local Audio element
- No database writes needed — pure ephemeral broadcast

## Admin Detection

Check current user's email against the two admin emails:
```typescript
const ADMIN_EMAILS = ['demo-admin@startupfactoryhub.com', 'ceo@imagineengine.space'];
const isAdmin = ADMIN_EMAILS.includes(user?.email);
```

No RLS or role table check needed — this is a UI-level control for a specific portal feature.

## Audio Effects Implementation

Use the Web Audio API (`AudioContext`, `GainNode`, `BiquadFilterNode`, `DelayNode`) for real-time effects:
- **Volume**: GainNode
- **Bass Boost**: BiquadFilterNode (lowshelf)
- **Echo**: DelayNode + feedback loop
- **Speed**: `playbackRate` on the audio element (only works for non-streaming; for streams, skip or use pitch shift)

## Integration

- Replace the current simple `toggleRadio` button in `HotDealsPortal.tsx` with a toggle that opens/closes the DJ console panel
- The DJ console renders as a collapsible section below the header or as a fixed bottom panel
- Clicking "RADIO" in the header toggles the DJ panel visibility
- The panel slides in/out with animation

## Files

| File | Action |
|------|--------|
| `src/components/HotDealsDJConsole.tsx` | **New** — full DJ console component with turntables, mixer, effects, VU meter |
| `src/hooks/useDJBroadcast.ts` | **New** — Supabase Realtime broadcast hook for DJ state sync |
| `src/pages/HotDealsPortal.tsx` | **Modify** — integrate DJ console panel, update radio toggle to show/hide console |

## Key Behaviors

- When admin changes volume → all users hear volume change within ~100ms
- When admin switches track → all users' audio switches to new stream
- When admin toggles effect → all users' audio processing chain updates
- Non-admin users see controls move/update in real-time but cannot interact
- Console is lightweight CSS — no heavy assets or images

