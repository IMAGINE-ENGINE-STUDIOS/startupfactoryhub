

# Fix Share Link, Banner Overlap, and Add Radio Station Button

## Issues & Changes

### 1. Fix Share Link not working
The share URL is hardcoded to `https://startupfactoryhub.com/hot-deals-space` instead of using the actual current URL. Fix by using `window.location.href` so the copied/shared link actually works. Also, the share dropdown uses `fixed right-4` positioning which can cause overlap issues -- change to `absolute` positioning relative to the parent button.

### 2. Fix banner underlapping (z-index issue)
The `HotDealsRocketBanner` section sits in a separate `div` above the main content area. The share menu dropdown at `z-[9999]` may get clipped or the banner may visually overlap content below it. Ensure proper stacking by keeping the banner inside the main content flow instead of a separate wrapper, or adjusting z-index layering.

### 3. Add "Radio Station" button next to "RACE DAY" badge
Add a toggle button labeled "RADIO STATION" with a `Radio` icon next to the "RACE DAY" pill in the header. It will have a pulsing/glowing animation so users know they can interact with it. When clicked, it toggles playback of Startup Factory Hub background music using an HTML5 `Audio` element.

For the music source, we will use a royalty-free space/electronic ambient loop hosted as a static audio file or a placeholder URL that can be swapped later. The button will:
- Show a glowing orange pulse animation when music is playing
- Show a muted/dim state when off
- Use `Volume2` icon when playing, `VolumeX` when muted
- Have "RADIO STATION" text label

## Technical Details

### File: `src/pages/HotDealsPortal.tsx`

**Share link fix:**
- Replace `const shareUrl = "https://startupfactoryhub.com/hot-deals-space"` with `const shareUrl = window.location.href`
- Change share dropdown from `fixed right-4` to `absolute right-0` so it positions relative to the button wrapper

**Radio Station button:**
- Add `useRef<HTMLAudioElement>` for audio playback
- Add `isPlaying` state
- Add a styled button next to the RACE DAY badge with `Radio` icon, pulsing border animation when active
- Audio source: placeholder MP3 URL (easily replaceable)

**Banner fix:**
- Remove the separate wrapper div for `HotDealsRocketBanner` and move it inside the main `space-y-6` content div so it flows naturally without z-index conflicts

### Keyframe addition in `tailwind.config.ts`
- Add a `radio-pulse` keyframe for the glowing animation on the Radio Station button

## Files Modified
- `src/pages/HotDealsPortal.tsx` — fix share link, fix banner position, add Radio Station button
- `tailwind.config.ts` — add `radio-pulse` animation keyframe

