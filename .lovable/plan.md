

# Restore DJ Microphone to DJ Console While Keeping It Persistent

## What changed and what's wrong

The `DJMicrophone` was moved from inside the DJ console to the top of `HotDealsPortal.tsx` so it stays alive when the panel is hidden. However, `if (hidden) return null` at line 463 means:
- When DJ panel is **open**: mic renders at the top of the page (outside the console — wrong position)
- When DJ panel is **closed**: mic returns null (correct for persistence since hooks stay alive above)

The user wants the mic UI **back inside the DJ console** visually, but the component must stay always-mounted so streams and announcements survive panel hide/show.

## Plan

### 1. Keep `DJMicrophone` always-mounted in `HotDealsPortal.tsx` (no change to mount point)
The component stays at the top level for persistence — hooks, refs, mic streams, and announcement channels remain alive regardless of DJ panel state.

### 2. Change `hidden` behavior — render an invisible placeholder instead of `return null`
In `DJMicrophone.tsx`, when `hidden` is true, render a zero-size invisible `<div>` instead of returning null. This keeps the DOM minimal but ensures React doesn't short-circuit any internal logic that might depend on rendered refs.

### 3. Portal the visible UI into the DJ console
When `hidden` is false (DJ panel is open), use `ReactDOM.createPortal` to render the mic UI into a container element inside `HotDealsDJConsole`. The console will provide a `<div id="dj-mic-slot" />` placeholder where the mic UI will appear, restoring it to its original visual position.

**Alternative (simpler)**: Instead of portals, just wrap the mic UI in a div that uses `hidden` to toggle `display:none` vs visible, and position it as a fixed/absolute element that only shows when the DJ panel is open. But this still renders at top level, not inside the console.

**Simplest approach**: Keep the always-mounted `DJMicrophone` in `HotDealsPortal.tsx` with `hidden={!showDJ}`. Change the `if (hidden) return null` to wrap the entire UI in a `<div style={{ display: hidden ? 'none' : 'block' }}>` so the DOM stays but is invisible. Then in `HotDealsDJConsole.tsx`, add a portal target div, and use `createPortal` in `DJMicrophone` to render into it when it exists.

## File Changes

| File | Change |
|------|--------|
| `src/components/dj/DJMicrophone.tsx` | Replace `if (hidden) return null` with a portal approach: when the `#dj-mic-slot` element exists in DOM, portal the mic UI into it; when it doesn't (panel closed), render nothing visible but keep hooks alive |
| `src/components/HotDealsDJConsole.tsx` | Add a `<div id="dj-mic-slot" />` placeholder where the microphone UI should appear (its original location inside the console) |
| `src/pages/HotDealsPortal.tsx` | No changes needed — `DJMicrophone` stays always-mounted at top level |

