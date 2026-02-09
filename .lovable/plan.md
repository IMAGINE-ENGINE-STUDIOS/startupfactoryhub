
# Fix Edit Mode for Uploaded Documents

## Problem Summary
When uploading files in "Edit Mode," documents either stay in View Mode or the Edit toggle button doesn't work. There are three separate bugs:

1. **DOCX files in Edit Mode** load as raw HTML into the editor with `viewMode=false`, but the toggle button assumes `viewMode=true` with images -- so clicking it does nothing useful.
2. **PDF files in Edit Mode** load correctly as hybrid (images + text layers), but if `editTextViewportSize` is null or text layers are empty, the edit overlay doesn't render, making it look identical to View Mode.
3. **The toggle button logic** has conflicting conditions that don't cover all states properly.

## Solution

### 1. Fix the Edit/View toggle button logic (LightPaperDocument.tsx ~line 2305)
- Track a new state `uploadedAsEdit` that is set to `true` when a file is uploaded via Edit Mode.
- When `uploadedAsEdit` is true AND the document is in HTML edit mode (not view mode with images), the toggle button should switch between the rich editor and a read-only/view presentation.
- When in hybrid mode (images + text layers), the toggle should work as currently intended.

### 2. Ensure DOCX Edit Mode produces editable content properly (AdvancedDocumentParser.ts)
- For DOCX files, `parseDocumentForEditing` currently returns HTML without images. This is correct behavior, but the document component needs to properly recognize this and enable the contentEditable editor.
- The content loading logic already handles this (lines 488-519), but the editor's `contentEditable` state needs to be explicitly enabled.

### 3. Fix state initialization on upload (LightPaperDocument.tsx ~lines 303-520)
- When hybrid mode content loads (PDF edit): ensure `editTextViewportSize` is always set from metadata dimensions. Add a fallback default if dimensions are missing.
- When HTML edit mode loads (DOCX edit): ensure the editor div is set to `contentEditable=true` and `editMode=true`, and the content is properly injected.

### 4. Fix the bottom status bar (LightPaperDocument.tsx ~line 2549)
- Update the status indicator to show "Edit Mode" when `editMode` is true regardless of whether it's hybrid or HTML-based editing.

## Technical Changes

### File: `src/components/lightpaper/LightPaperDocument.tsx`

**A) Add tracking state for upload source:**
- Add `const [uploadSource, setUploadSource] = useState<'edit' | 'view' | null>(null);`
- Set it in the content loading `useEffect` based on the parsed mode.

**B) Fix toggle button (around line 2305-2325):**
- When `viewMode` is true and images exist and text layers exist: toggle `editMode` (hybrid).
- When `viewMode` is true and images exist but NO text layers: show disabled or info that edit isn't available for this file.
- When `viewMode` is false (HTML edit mode): toggle between `contentEditable` true/false for view vs edit.

**C) Fix hybrid mode fallback (around line 3014):**
- Add fallback viewport size if `editTextViewportSize` is null but text layers exist. Use the image's natural dimensions as fallback.

**D) Ensure `editMode` state is correctly initialized:**
- In the hybrid branch (line 342): already sets `editMode(true)` -- keep this.
- In the HTML branch (line 491): already sets `editMode(true)` -- keep this.
- Ensure that when the user explicitly clicked "Edit Mode" in FileUploadDialog, the document component respects it.

### File: `src/components/lightpaper/FileUploadDialog.tsx`

**E) Pass upload mode in metadata:**
- Add `uploadMode` to the metadata passed to `onFileLoaded` so the document component knows the user's intent:
  ```
  onFileLoaded(content, title, { detectedFormat, fileType, uploadMode: 'edit' })
  ```

This ensures the document component can differentiate between "user wanted edit mode" vs "file was processed as view mode."
