

## Fix PDF Text Overlay Editor on Desktop

### What's Happening

The desktop toolbar Edit button has complex branching logic for PDFs that can fail in certain conditions, while the mobile toolbar has a simpler toggle that "just works." There are two specific issues:

1. **Mobile Edit button is too simple** -- it just toggles `editMode` without loading text layers for PDFs. It only works if text layers were already loaded (e.g., from the initial upload). If the user opens a restored project and tries Edit on mobile first, it would also fail to show text overlays.

2. **Desktop Edit button can get stuck** -- When `originalFile` is null (after restoring a saved project from database), the PDF re-parse condition at line 2579 fails because `originalFile` is required but cannot be serialized/restored. The button still toggles `editMode`, but if `editTextLayers` were also not restored properly, nothing visible happens.

3. **The removed "Text Edit" button** may have been the user's primary way to trigger PDF editing on desktop. Without it, the main Edit toggle (which requires scrolling the toolbar to find) is the only option.

### Fix Plan (Single File: `LightPaperDocument.tsx`)

#### 1. Sync mobile Edit button logic with desktop
Update the mobile toolbar's Edit/View button (lines 2728-2733) to include the same PDF text layer loading logic as desktop -- call `parseDocumentForEditing` when `uploadedFileType === 'pdf'` and `editTextLayers` are empty and `originalFile` is available.

#### 2. Fix desktop Edit button for restored projects
When `originalFile` is null but `editTextLayers` are already restored from the database (line 709), the desktop button should just toggle `editMode` without trying to re-parse. This already works at line 2601, BUT the condition at line 2579 also requires `editTextLayers.length === 0` -- if layers are restored, it correctly skips re-parsing. The issue may be that layers aren't being restored properly.

Add a console.log to the Edit button click handler to debug the exact state when clicked:
- `viewMode`, `editMode`, `uploadedFileType`, `originalFile` (truthy/falsy), `editTextLayers.length`

#### 3. Ensure text layers persist across Edit/View toggles
Verify that toggling `editMode` off does NOT clear `editTextLayers`. Currently it doesn't (the else branch at line 2601-2606 only calls `setEditMode`), but add explicit protection to ensure layers are never accidentally cleared during a simple toggle.

### Technical Details

**File: `src/components/lightpaper/LightPaperDocument.tsx`**

**Change 1 -- Mobile toolbar (lines 2728-2733):**
Replace the simple `setEditMode(!editMode)` with the full PDF-aware logic that matches the desktop button, including `parseDocumentForEditing` when text layers need loading.

**Change 2 -- Desktop toolbar (lines 2527-2620):**
Add debug logging to the click handler to trace which branch is executing. Also add a fallback: if `editMode` is toggled ON but `editTextLayers` is empty and we have `viewModeImages`, show a clear toast telling the user they can use the Text Box tool.

**Change 3 -- No functional changes to rendering (lines 3309-3368):**
The text span rendering logic stays exactly the same. The fix is purely in the toggle button handlers.

### What Won't Change
- Text overlay rendering stays the same
- View Mode stays the same  
- PDF export fix stays the same
- DOCX logic untouched
- OverlayTextBox (annotations) untouched
- All other toolbar buttons untouched
