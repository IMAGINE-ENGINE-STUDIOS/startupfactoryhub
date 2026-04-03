

# Fix: Content Overflow When Opening Event Info

## Problem
When opening event details (EventDetailsDialog), the content overflows the viewport horizontally, causing side-to-side scrolling. The dialog content is too wide for its container, and there's no constraint preventing horizontal overflow.

## Root Causes

1. **EventDetailsDialog** (line 289): Uses `max-w-3xl max-h-[90vh] overflow-y-auto` but lacks `overflow-x-hidden`, so wide child elements (share URL input, long text) can push content beyond the dialog bounds.

2. **DialogContent base component** (`dialog.tsx` line 20): The base `DialogContent` has no overflow constraint — any child that exceeds `max-w-lg` (or `max-w-3xl` when overridden) causes horizontal scroll on the entire page.

3. **CesiumISSTracker**: Cesium's viewer injects its own widget toolbars that can escape the container overflow boundary, contributing to page-level horizontal scroll.

## Fix Plan

### 1. Fix `DialogContent` base component (`src/components/ui/dialog.tsx`)
- Add `overflow-hidden` to the outer `DialogContent` wrapper so no child can cause horizontal page scroll.

### 2. Fix `EventDetailsDialog` (`src/components/EventDetailsDialog.tsx`)
- Add `overflow-x-hidden` alongside existing `overflow-y-auto` on line 289.
- Add `break-words` / `word-break: break-word` to prevent long URLs or text from overflowing.
- Constrain the share URL input with `overflow-hidden text-ellipsis` and `min-w-0`.

### 3. Fix `CesiumISSTracker` (`src/components/CesiumISSTracker.tsx`)
- Add `overflow: hidden` to the Cesium container div to prevent internal widget overflow.

### 4. Add global safety (`src/index.css`)
- Ensure `#root` has `overflow-x: hidden` and `max-width: 100vw` as a final safety net.

## Files Modified
- `src/components/ui/dialog.tsx` — add overflow-hidden to DialogContent
- `src/components/EventDetailsDialog.tsx` — add overflow-x-hidden, word-break constraints
- `src/components/CesiumISSTracker.tsx` — add overflow-hidden to container
- `src/index.css` — add #root overflow safety

