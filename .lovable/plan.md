

## Fix PDF Export to Match Original Document

### Problem
When you download/export a PDF that was edited, the text overlay spans (used for editing) are captured by `html2canvas`, creating visible colored boxes and duplicate text over the original PDF content. The exported PDF should look like the original, with only the user's actual edits applied.

### Root Cause
The export function at line 1962 captures page containers using `html2canvas`, which renders everything visible on the page -- including the editing overlay layer (the `div` with `className="absolute inset-0"` at line 3299). Since the overlay spans now have visible `color` and `backgroundColor`, they appear as colored rectangles in the export.

### Fix (Single File Change)

**File: `src/components/lightpaper/LightPaperDocument.tsx`**

In the `handleExportPDF` function (line 1954), before capturing each page with `html2canvas`:

1. **Hide ALL text overlay layers** -- Find all elements with class `pdf-text-span`'s parent overlay containers and set `display: none` temporarily
2. **Capture the page** -- `html2canvas` now only sees the original PDF image plus any user-added overlay text boxes (annotations)
3. **Restore the overlay layers** -- Set `display` back after capture

This is a ~10-line change inside the existing export loop (lines 1972-2014). The overlay text boxes (annotations the user added) will still be captured since they are separate elements. Only the editing text layer is hidden.

### What Won't Change
- Edit Mode behavior stays the same
- View Mode stays the same
- Text overlay visibility stays the same
- Overlay text box annotations still export correctly
- DOCX export logic untouched

