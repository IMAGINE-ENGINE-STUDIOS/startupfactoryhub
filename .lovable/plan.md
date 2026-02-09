

## Fix PDF Text Overlay Editing

### What's Wrong

There are two overlapping buttons trying to control PDF text editing -- the main **Edit/View** toggle button and the new **Text Edit** button -- and they conflict with each other. The main Edit button (lines 2567-2588) tries to load text layers AND toggle `editMode`, while the Text Edit button (lines 2616-2640) does the exact same thing. When the user clicks either button:

1. The main **Edit** button loads text layers and sets `editMode = true`
2. But the text spans render with `color: 'transparent'` -- they're invisible until individually clicked/focused
3. The user sees no visible change and thinks it's broken
4. The **Text Edit** button also has `viewMode && uploadedFileType === 'pdf'` as its show condition, but once `editMode` is toggled ON via the main button, the Text Edit button still shows (since `viewMode` stays true), creating confusion about which button to use

The core issue: the text overlay system works, but the toggle flow is broken because two buttons fight over the same state, and there's no clear visual feedback that editing is active.

### Fix Plan

#### 1. Remove the duplicate "Text Edit" button (lines 2609-2646 in LightPaperDocument.tsx)

The separate button adds confusion. Instead, make the **main Edit/View toggle** the single entry point for PDF text editing, which is how it originally worked.

#### 2. Fix the main Edit/View toggle for PDFs (lines 2567-2595)

Ensure the PDF branch in the main toggle button:
- Loads text layers on first click (already does this at line 2567-2578)
- Properly toggles `editMode` on subsequent clicks (already does this at line 2589-2591)
- Shows a clear toast message indicating text editing is active

#### 3. Make text spans visible immediately when edit mode is active

Currently text spans start with `color: 'transparent'` and only show on focus. Change this so when `editMode` is true, ALL text spans render with their actual text color and background color immediately, giving clear visual feedback that editing is active. On blur after no changes, keep them visible (don't revert to transparent).

This is the key UX fix -- the user needs to SEE the text overlay is active.

### Technical Details

**File: `src/components/lightpaper/LightPaperDocument.tsx`**

Changes:
1. **Delete lines 2609-2646** -- remove the duplicate "Text Edit" button entirely
2. **Lines 3368-3392 (text span rendering)** -- change `color: 'transparent'` to `color: item.color` and `background: 'transparent'` to `background: item.backgroundColor` so text is always visible in edit mode
3. The `onFocus`/`onBlur` handlers can be simplified since text is already visible

This is a minimal, surgical fix that doesn't touch DOCX logic at all.
