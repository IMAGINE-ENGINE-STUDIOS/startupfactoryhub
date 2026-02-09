

## Fix PDF Export: Deformed Output, Missing Edits, Empty Text Boxes

### Problem Summary

Three issues with the exported PDF, all stemming from the export logic in `handleExportPDF`:

1. **Edits missing**: The text overlay spans (`.pdf-text-span`) are only rendered when `editMode` is true (line 3306), but the export captures pages in View Mode where `editMode` is false -- so the edited text is simply not in the DOM when `html2canvas` takes the screenshot.

2. **Deformed/stretched output**: The line `pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)` forces every captured image to fill an entire A4 page (210x297mm). If the original PDF page has a different aspect ratio (e.g., widescreen/landscape), it gets stretched vertically.

3. **Empty text boxes**: OverlayTextBox components appear as empty rectangles because of the stretching distortion and potential html2canvas rendering issues with contentEditable elements.

### Root Causes and Fixes

**File: `src/components/lightpaper/LightPaperDocument.tsx`**

#### Fix 1: Make text overlay spans visible during export (lines 1972-2001)

Before calling `html2canvas` on each page container, temporarily inject the edit text layer spans into the DOM even when in view mode. The approach:

- Before the capture loop, temporarily set a CSS class or inline style that forces `.pdf-text-span` parent containers to be visible regardless of `editMode`
- Specifically: query all `[id^="page-"] .absolute` containers that hold text spans, and force `display: block` on them
- After capture, restore the original display state

Alternatively (cleaner approach): temporarily set `editMode = true` state is not feasible since React re-render is async. Instead, directly manipulate the DOM:

```text
For each page container before capture:
1. Find the text overlay div (the .absolute.inset-0 parent)
2. If it doesn't exist (because editMode is false and React didn't render it),
   create temporary span elements from editTextLayers data and append them
3. After capture, remove the temporary elements
```

The cleanest approach: Create a dedicated export rendering function that manually draws text spans onto the canvas AFTER html2canvas captures the base image, using Canvas 2D API to write the edited text at the correct positions.

#### Fix 2: Preserve aspect ratio (lines 1997-2001)

Replace the forced full-bleed fill with aspect-ratio-aware sizing:

```text
Before (broken):
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

After (fixed):
  const imgAspect = canvas.width / canvas.height;
  const pageAspect = pdfWidth / pdfHeight;
  let drawW, drawH, drawX, drawY;
  
  if (imgAspect > pageAspect) {
    // Image is wider - fit to width
    drawW = pdfWidth;
    drawH = pdfWidth / imgAspect;
    drawX = 0;
    drawY = 0;  // Top-aligned, no centering
  } else {
    // Image is taller - fit to height
    drawH = pdfHeight;
    drawW = pdfHeight * imgAspect;
    drawX = 0;  // Left-aligned
    drawY = 0;
  }
  
  // Use matching page size instead of forcing A4
  pdf.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH);
```

Even better: set the PDF page size to match each captured image's actual dimensions rather than forcing a fixed page format. This eliminates gaps entirely.

#### Fix 3: Render edits onto canvas directly (most reliable approach)

After `html2canvas` captures the base page image, draw the edited text spans directly onto the canvas using Canvas 2D context. This bypasses all DOM visibility issues:

```text
For each page:
1. html2canvas captures the base page image (just the PDF image)
2. Get the canvas 2D context
3. For each text span in editTextLayers[pageIndex]:
   - Set font, color, size matching the span styles
   - Draw a filled rectangle with the background color (to cover original text)
   - Draw the text at the correct position
4. Then convert canvas to image for jsPDF
```

This is the most reliable method because it doesn't depend on React rendering state or DOM manipulation timing.

### Implementation Plan

1. **Modify `handleExportPDF` view mode branch** (lines 1962-2008):
   - Before capture: for each page, temporarily inject text overlay spans into the DOM by creating elements from `editTextLayers` data and appending to the page container
   - Set proper styles matching the rendering logic (lines 3328-3350)
   - After html2canvas capture, remove temporary elements
   
2. **Fix aspect ratio**: Use the captured canvas dimensions to set proper draw dimensions in jsPDF, top-left aligned with no stretching

3. **Handle OverlayTextBox content**: Ensure overlay text boxes have their text content properly set before capture

### What Won't Change
- Text span rendering logic in the main component (lines 3305-3364)
- Edit mode toggle logic
- View mode rendering
- DOCX export path
- Mobile toolbar
