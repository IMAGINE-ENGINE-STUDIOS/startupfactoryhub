

# Fix Document Upload Fidelity and Export Accuracy

## Problem Analysis

After thorough code review, I identified **three root causes** why uploaded documents look different from the originals and why exports don't include edits:

### Root Cause 1: DOCX Upload Uses Low-Fidelity HTML Reconstruction
The `parseDOCX()` function in `AdvancedDocumentParser.ts` renders DOCX files using the `docx-preview` library into a temporary off-screen container, extracts the raw HTML, and wraps it with a CSS scale transform. This approach:
- Loses precise formatting (margins, spacing, indentation)
- Doesn't produce page-by-page images like PDF View Mode does
- The scale calculation is based on a single content measurement that may be inaccurate

### Root Cause 2: Edit Mode Converts Reconstructed Pages to Images via html2canvas (Unreliable)
In `LightPaperDocument.tsx` lines 338-448, when Edit Mode content is loaded, the code clones the reconstructed HTML pages into a hidden container and uses `html2canvas` to capture them. This is brittle because:
- The cloned elements may not render identically when detached from their original context
- CSS styles, fonts, and images can fail to load in the hidden container
- The 100ms delay before capture may not be enough for complex layouts

### Root Cause 3: DOCX Has No View Mode Support
`parseDocumentAsImages()` only supports PDFs. For DOCX files, it throws an error: "View Mode currently only supports PDF files." This means DOCX files are forced through the lossy Edit Mode path.

## Solution

### Step 1: Add DOCX Support to View Mode (Image-Based Rendering)
Modify `parseDocumentAsImages()` in `AdvancedDocumentParser.ts` to support DOCX files by:
1. Rendering the DOCX into a hidden container using `docx-preview` (same as now)
2. Using `html2canvas` to capture the fully-rendered container as high-res images (page by page)
3. Returning these images in the same format as PDF View Mode

This ensures DOCX files get the same pixel-perfect treatment as PDFs.

### Step 2: Fix Edit Mode Upload to Use Direct Image Rendering
Instead of the current flow (parse to HTML, clone to hidden container, re-render with html2canvas), change Edit Mode for PDFs to:
1. Render each PDF page directly to a canvas using `pdf.js` (which already works perfectly in View Mode)
2. Return the canvas images wrapped in editable overlay containers
3. This removes the fragile html2canvas-of-cloned-HTML step entirely

### Step 3: Fix Export to Properly Capture All Visible Content
The export function (`handleExportPDF`) needs to:
1. Iterate through ALL pages (not just the visible one) in View Mode
2. Temporarily scroll to each page container before capture
3. Ensure overlays (signatures, text boxes) are captured at their correct positions
4. Reset zoom transform consistently before AND after capture

## Technical Details

### File: `src/components/lightpaper/AdvancedDocumentParser.ts`

**Change 1:** Update `parseDocumentAsImages` to handle DOCX files:
- Render DOCX into hidden container with `docx-preview`
- Enable `breakPages: true` to get separate page sections
- Use `html2canvas` to capture each page section as a PNG image
- Return images array in the same format as PDF View Mode

**Change 2:** Improve DOCX rendering dimensions:
- Use the actual rendered dimensions from `docx-preview` instead of fixed constants
- Account for multi-page DOCX documents by detecting page breaks

### File: `src/components/lightpaper/LightPaperDocument.tsx`

**Change 3:** Simplify Edit Mode content loading (lines 338-448):
- For PDF files in Edit Mode, use `pdf.js` canvas rendering directly (same as View Mode) instead of html2canvas on cloned HTML
- This eliminates the fragile hidden-container approach
- Fall back to View Mode images with editable overlay text boxes

**Change 4:** Fix export page iteration in View Mode (lines 1679-1734):
- Ensure `pageContainers` selector finds all page divs correctly
- Add proper timing for each page capture
- Verify signatures and overlay text boxes are included in the DOM during capture

### File: `src/components/lightpaper/FileUploadDialog.tsx`

**Change 5:** Enable View Mode for DOCX files:
- Remove the PDF-only restriction message
- Both modes should work for both file types

## Expected Results

After these changes:
- **View Mode (PDF):** Pixel-perfect rendering (already works, no changes)
- **View Mode (DOCX):** New capability - renders as high-res images identical to the original
- **Edit Mode (PDF):** Uses canvas rendering instead of fragile HTML reconstruction
- **Edit Mode (DOCX):** Improved rendering with proper page detection
- **Export/Download:** Captures all pages with all edits, signatures, and overlays visible

