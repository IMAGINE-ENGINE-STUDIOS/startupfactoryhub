# PDF Editor - Fabric.js Implementation

## Overview
Complete rebuild of the PDF editor using Fabric.js v6 for true real-time editing with object manipulation.

## Architecture

### Core Components

#### 1. `FabricPDFEditor.tsx` - Main Component
- **Purpose**: Renders PDF with Fabric.js overlay on each page
- **Key Features**:
  - PDF upload and storage in Supabase
  - Multi-page rendering with react-pdf
  - Individual Fabric canvas per page
  - Real-time editing with instant visual feedback
  - Session persistence (save/load)
  - Export to flattened PDF

#### 2. `FabricToolbar.tsx` - Toolbar Component
- **Purpose**: Provides editing tools and controls
- **Tools Available**:
  - Select: Move, resize, rotate objects
  - Text: Click to add editable text
  - Draw: Freehand drawing
  - Rectangle: Add rectangles
  - Circle: Add circles
  - Image: Upload and place images
  - Eraser: Delete selected objects
- **Controls**:
  - Color picker
  - Font size selector
  - Zoom in/out
  - Save/Export buttons

#### 3. `PDFFabricManager` (`src/lib/pdf/fabricManager.ts`) - Engine
- **Purpose**: Manages all Fabric.js canvases and operations
- **Capabilities**:
  - Create/dispose canvases for each page
  - Tool management (select, draw, shapes, text)
  - Add/remove objects
  - Export/import Fabric JSON
  - Track dirty state

## Data Flow

### 1. Upload PDF
```
User uploads PDF → Store in Supabase Storage → Create editing session → Load PDF in viewer
```

### 2. Edit Operations
```
User selects tool → FabricManager updates canvas → Objects immediately visible → Changes tracked
```

### 3. Save Session
```
User clicks Save → Export all Fabric canvases to JSON → Store in pdf_editing_sessions.session_data
```

### 4. Load Session
```
Load session → Retrieve session_data → Parse Fabric JSON → Restore objects on canvases
```

### 5. Export PDF
```
User clicks Export → Render Fabric canvases to PNG images → Send to edge function → Flatten onto PDF → Download
```

## Database Schema

### `pdf_editing_sessions` Table
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- pdf_url: TEXT (original PDF URL)
- title: TEXT (filename)
- session_data: JSONB (Fabric JSON per page)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- is_active: BOOLEAN
```

### Session Data Format
```json
{
  "1": "{...Fabric canvas JSON for page 1...}",
  "2": "{...Fabric canvas JSON for page 2...}",
  "3": "{...Fabric canvas JSON for page 3...}"
}
```

## How to Use

### As a User

1. **Upload a PDF**
   - Click "Choose PDF File"
   - Select any PDF from your computer
   - Wait for upload to complete

2. **Edit the PDF**
   - Select a tool from the toolbar
   - Click on the PDF to add objects
   - Select objects to move, resize, or rotate
   - Change colors and font sizes as needed

3. **Save Your Work**
   - Click "Save" to persist changes to database
   - Your session is stored and can be resumed later

4. **Export Final PDF**
   - Click "Export" to generate final PDF
   - All edits are flattened onto the original PDF
   - Download the result

### As a Developer

#### Add a New Tool

1. Update `PDFFabricManager` in `src/lib/pdf/fabricManager.ts`:
```typescript
addCustomShape(pageNumber: number): void {
  const canvas = this.getCanvas(pageNumber);
  if (!canvas) return;

  const shape = new CustomFabricObject({
    // ... properties
  });

  canvas.add(shape);
  canvas.setActiveObject(shape);
}
```

2. Add tool to `FabricToolbar.tsx`:
```typescript
const toolButtons = [
  // ... existing tools
  { tool: 'custom' as const, icon: CustomIcon, label: 'Custom' },
];
```

3. Handle tool in toolbar click handler:
```typescript
if (tool === 'custom') {
  fabricManager.addCustomShape(currentPage);
}
```

#### Customize Object Appearance

Edit default properties in `PDFFabricManager`:
```typescript
addText(pageNumber: number, x: number, y: number): void {
  const text = new IText('Type here', {
    left: x,
    top: y,
    fontSize: this.activeFontSize,
    fill: this.activeColor,
    fontFamily: 'Arial', // Change default font
    // Add more customizations
  });
  // ...
}
```

## Export Process

### Client-Side (Step 1)
1. For each page, render Fabric canvas to PNG image
2. Create base64 data URLs for all edited pages
3. Send to edge function with original PDF URL

### Edge Function (Step 2)
1. Receives `pageImages` (page number → base64 PNG)
2. Loads original PDF using pdf-lib
3. For each edited page:
   - Decode base64 PNG
   - Embed image in PDF
   - Draw image over entire page
4. Save modified PDF to storage
5. Return signed URL for download

## Keyboard Shortcuts (Future)

- `Ctrl/Cmd + S`: Save
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Delete`: Delete selected object
- `Ctrl/Cmd + D`: Duplicate selected

## Troubleshooting

### Objects Not Appearing
- Check that `onPageRenderSuccess` is called for each page
- Verify canvas dimensions match PDF page dimensions
- Ensure Fabric canvas is properly initialized

### Save Not Working
- Check user is authenticated
- Verify session_id exists
- Check browser console for errors

### Export Fails
- Ensure edge function is deployed
- Check that pdf-lib is correctly installed in function
- Verify image data is properly encoded

### Canvas Positioning Issues
- Ensure canvas overlay has `position: absolute`
- Verify parent container has `position: relative`
- Check that canvas dimensions match PDF dimensions with zoom

## Performance Considerations

- Each page has its own Fabric canvas (memory usage increases with page count)
- Large PDFs (50+ pages) may be slow to render
- Export can take time for large documents with many edits
- Consider lazy loading for multi-page documents

## Future Enhancements

- [ ] Undo/Redo system
- [ ] Keyboard shortcuts
- [ ] Collaboration (real-time multi-user editing)
- [ ] Form field detection and filling
- [ ] Digital signatures
- [ ] Comment/annotation system
- [ ] Template library
- [ ] Mobile responsiveness
- [ ] Accessibility improvements

## Migration from Old Editor

The old `SimplePDFEditor` and `PDFEditorCore` used Canvas 2D API with manual drawing. They have been replaced with this Fabric.js implementation for:

- ✅ Real-time object manipulation
- ✅ Better user experience
- ✅ Professional editing capabilities
- ✅ Easier maintenance
- ✅ Extensible architecture

Old sessions are not compatible with the new format. Users will need to start fresh editing sessions.
