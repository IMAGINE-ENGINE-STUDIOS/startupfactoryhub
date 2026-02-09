

## Fix DOCX Edit Mode: True Editing with Layout Fidelity

### Problem Summary

Currently, DOCX files in **Edit Mode** use the same hybrid image+overlay approach as PDFs. This means:
- Text appears as transparent overlays on top of page images
- Users can only annotate (add text boxes on top), NOT actually edit the original text
- The "Edit" toggle just enables/disables overlay annotations

The user wants DOCX Edit Mode to allow **real editing** -- erasing, modifying, and reformatting the actual document text -- while keeping the layout as close to the original as possible.

### Root Cause

The `parseDOCX()` function (which produces real editable HTML) aggressively strips formatting:
- Sets `ignoreWidth: true` and `breakPages: false`
- Removes all width values from CSS
- This destroys the original layout, making it look nothing like the View Mode version

Meanwhile, `parseDocxForEditing()` preserves layout perfectly (image-based) but only supports overlay annotations, not real editing.

### Solution

Rewrite the DOCX Edit Mode pipeline to use `docx-preview` with **layout-preserving settings** (same as View Mode) but output real, editable HTML instead of images.

### Changes

#### 1. `AdvancedDocumentParser.ts` -- New `parseDOCXEditable()` function

- Render with `breakPages: true`, `ignoreWidth: false`, `ignoreHeight: false` (same settings as View Mode for layout fidelity)
- Instead of capturing images with html2canvas, extract the actual rendered HTML from each page section
- Preserve all inline styles, fonts, spacing, and formatting
- Only remove `contenteditable="false"` attributes to allow editing
- Return HTML per page (not images) so the editor can display real editable content

#### 2. `AdvancedDocumentParser.ts` -- Update `parseDocumentForEditing()`

- Route DOCX files through the new `parseDOCXEditable()` instead of `parseDocxForEditing()` (hybrid)
- Return result with `html` content (not `images`/`textLayers`)

#### 3. `LightPaperDocument.tsx` -- Edit Mode Content Loading

- When DOCX edit mode content arrives as HTML (not JSON with images), load it into the contenteditable editor
- Wrap each page's HTML in a page container that matches the document dimensions
- Preserve the page-by-page structure for proper pagination
- Keep `contentEditable="true"` on the editor for real text manipulation

#### 4. `LightPaperDocument.tsx` -- Edit Toggle for DOCX

- When toggling from View to Edit on a DOCX file, re-parse the original file using the new `parseDOCXEditable()` to get real editable HTML
- When toggling from Edit to View, re-parse using `parseDocumentAsImages()` to get pristine page images

### Technical Details

**New `parseDOCXEditable()` function approach:**

```text
1. Render DOCX in hidden container with breakPages:true, ignoreWidth:false
2. Find all page sections (section.docx elements)
3. For each section, extract innerHTML preserving all styles
4. Remove contenteditable="false" attributes
5. Keep all widths, margins, fonts, spacing intact
6. Return as HTML string with page dividers
7. If only 1 section found, use the full content as a single page
```

**Key differences from current `parseDOCX()`:**
- Keep `ignoreWidth: false` (preserves original widths)
- Keep `breakPages: true` (preserves page breaks)
- Do NOT strip width/min-width/max-width CSS values
- Keep `inWrapper: true` for proper page structure

This ensures the Edit Mode HTML matches the View Mode layout while remaining fully editable.
