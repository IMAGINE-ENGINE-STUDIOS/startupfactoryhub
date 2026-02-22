

## Fix PDF Edit Mode

### Problem Analysis

After thorough code review, PDF edit mode has the correct state management (console logs confirm `editMode` toggles and `editTextLayers` load). The issue is likely in the **rendering/alignment** of text overlay spans. Three probable causes identified:

### Root Causes

1. **Scale factor mismatch**: When toggling from View to Edit mode via the Edit button, `parseDocumentForEditing` is called and returns `metadata.dimensions` (PDF viewport size). However, the `editTextViewportSize` state may not match the actual rendered image size on screen, causing text spans to be misaligned (shifted or wrong size), making them appear "not working."

2. **Overlay container sizing**: The text overlay container uses `className="absolute inset-0"` inside a `height: auto` page container. If the image hasn't fully loaded when edit mode activates, the overlay could have zero height, hiding all text spans.

3. **Page container `overflow: hidden`**: The `.page` CSS class sets `overflow: hidden`. While `.page.view-mode-page` overrides to `overflow: visible`, the `margin-bottom: 0` inline style could still affect layout.

### Implementation Plan

**File: `src/components/lightpaper/LightPaperDocument.tsx`**

1. **Fix the overlay container to use image dimensions directly** instead of relying on `inset-0`:
   - Instead of `className="absolute inset-0"`, set explicit `width: 100%` and `height: 100%` with `top: 0; left: 0; position: absolute`
   - This ensures the overlay always matches the image size

2. **Add debug logging to the edit text layer rendering** to verify:
   - Log `pageCssWidthPx`, `vpW`, and `sf` (scale factor) values
   - Log how many text spans are being rendered for each page
   - This will help confirm whether spans are created but invisible vs not created at all

3. **Ensure `editTextViewportSize` is set before rendering spans**:
   - In the Edit toggle handler (around line 2714), add a check that `editTextViewportSize` is set from `result.metadata.dimensions`
   - If dimensions are missing, compute from `getPageDimensions()` as fallback and log a warning

4. **Fix potential race condition**: When the edit mode toggle calls `parseDocumentForEditing`, the `setEditTextLayers` and `setEditTextViewportSize` state updates happen asynchronously. If `editMode` is set to `true` before the viewport size is updated, the first render could use a stale/fallback viewport, causing misalignment. Fix by batching these state updates or ensuring viewport is set first.

### Technical Details

The scale factor calculation:
```text
pageCssWidthPx = getPageDimensions().width * CM_TO_PX
                 (e.g., 21cm * 37.795 = 793.7px for A4)

vpW = editTextViewportSize.width
      (e.g., 612 PDF points for letter-size)

sf = pageCssWidthPx / vpW
     (e.g., 793.7 / 612 = 1.297)
```

If `editTextViewportSize` is null/undefined, the fallback uses `pageCssWidthPx` for both, making `sf = 1.0`. But PDF text coordinates are in PDF points (typically 612x792 for letter), so `sf = 1.0` would render everything at wrong positions. This is the most likely cause.

### Files to Modify

- `src/components/lightpaper/LightPaperDocument.tsx` — Fix overlay rendering, add debug logging, ensure viewport size is set correctly before enabling edit mode

