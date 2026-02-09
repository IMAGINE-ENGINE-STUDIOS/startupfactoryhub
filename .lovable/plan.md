
# Fix DOCX Upload Issues: Edit Mode Multi-Page + View-to-Edit Toggle

## Problems Identified

1. **DOCX Edit Mode shows only 1 page or images-only**: The `parseDocumentForEditing()` function for DOCX falls back to `parseDOCX()` which returns raw HTML (no images). This HTML is inserted into a single page editor, and the recursive pagination system (synthetic input events) fails to reliably split multi-page content.

2. **DOCX View Mode to Edit toggle does nothing**: Clicking "Edit" when a DOCX is loaded in View Mode only toggles a state flag and shows a toast ("use Text Box tool") -- it does not re-parse the document into editable HTML.

3. **Root cause**: For DOCX files, `parseDocumentForEditing()` does NOT produce images + text layers (hybrid mode) like it does for PDFs. It just falls back to raw HTML parsing which breaks multi-page rendering.

## Solution

### Part 1: Make DOCX Edit Mode use Hybrid Approach (like PDF)

Modify `parseDocumentForEditing()` in `AdvancedDocumentParser.ts` so that DOCX files also get the hybrid treatment: render pages as images (using the existing `parseDocxAsImages` logic) AND extract text content per page.

**Changes to `AdvancedDocumentParser.ts`:**
- Replace the DOCX fallback at line 1279-1281 with a new function `parseDocxForEditing()` that:
  1. Renders the DOCX into a hidden container using `docx-preview` (with `breakPages: true`)
  2. Captures each page/section as an image using `html2canvas` (reusing existing logic from `parseDocxAsImages`)
  3. Extracts text content from each section/page to create `TextLayerItem[][]` arrays
  4. Returns `{ images, textLayers, metadata }` -- the same hybrid format that PDFs use
- This ensures DOCX files in Edit Mode go through the JSON/hybrid path in `FileUploadDialog` and `LightPaperDocument`, getting proper multi-page image rendering with editable text overlays

### Part 2: Fix View-to-Edit Toggle for DOCX

Modify the Edit toggle handler in `LightPaperDocument.tsx` (around line 2430-2441):
- When toggling to Edit mode on a DOCX that was loaded in View Mode (no text layers), instead of just showing a toast, enable `editMode` so overlay text boxes and annotations work properly on top of the view-mode images
- This is already partially working but the toast message is misleading -- clean it up

### Part 3: Fix Pagination for HTML Fallback (safety net)

In `LightPaperDocument.tsx` (around line 530-545):
- Increase the reliability of the `triggerPagination` approach by using `requestAnimationFrame` instead of fixed timeouts
- Add a check: if after all iterations, only 1 page exists but content is clearly multi-page (scrollHeight >> clientHeight), log a warning

## Files to Modify

1. **`src/components/lightpaper/AdvancedDocumentParser.ts`** -- Add `parseDocxForEditing()` function and update the DOCX branch in `parseDocumentForEditing()`
2. **`src/components/lightpaper/LightPaperDocument.tsx`** -- Clean up the edit toggle handler for view-mode DOCX files

## Technical Details

### New `parseDocxForEditing()` function outline:

```text
1. Render DOCX in hidden container with breakPages: true
2. Find page sections (section.docx or .docx-wrapper > section)
3. For each section:
   a. Capture as image via html2canvas (scale: 2)
   b. Extract text nodes with their bounding rects relative to section
   c. Build TextLayerItem[] with position, font, color, backgroundColor
4. Return { images, textLayers, metadata } as hybrid ParsedContent
```

This ensures DOCX Edit Mode produces the same data structure as PDF Edit Mode, so the existing hybrid rendering pipeline handles it correctly with multi-page support.
