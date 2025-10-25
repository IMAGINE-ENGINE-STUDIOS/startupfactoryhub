# PDF Editor: 4-Step Tactical Build Plan

**Reality Check:** You're building a real PDF editor alone. This is doable in 4-6 weeks working part-time (10-15 hrs/week).

---

## 🎯 STEP 1: Foundation (Week 1)
**Goal:** Get PDF files loading and basic editing infrastructure working

### What You're Building
- Database tables for PDF sessions
- Edge function for PDF manipulation
- Basic UI to upload & view PDFs

### Actions

#### 1.1 Database Setup (30 min)
```sql
-- Create PDF editing session table
CREATE TABLE pdf_editing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  original_pdf_path TEXT NOT NULL,
  current_pdf_data BYTEA, -- Store the working PDF in memory
  operations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE pdf_editing_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users manage own PDF sessions"
ON pdf_editing_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_pdf_sessions_user ON pdf_editing_sessions(user_id);
CREATE INDEX idx_pdf_sessions_updated ON pdf_editing_sessions(updated_at DESC);
```

**Run this:** Use the migration tool to create this table.

---

#### 1.2 Create Edge Function (1 hour)

**File:** `supabase/functions/pdf-editor/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EditOperation {
  type: 'text' | 'image' | 'rectangle' | 'delete'
  pageIndex: number
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  fontSize?: number
  color?: [number, number, number]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { pdfBase64, operations } = await req.json()
    
    // Decode base64 PDF
    const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
    const pdfDoc = await PDFDocument.load(pdfBytes)
    
    // Apply each operation
    for (const op of operations) {
      const page = pdfDoc.getPages()[op.pageIndex]
      const { height: pageHeight } = page.getSize()
      
      // Convert Y coordinate (PDF uses bottom-left origin, we use top-left)
      const pdfY = pageHeight - op.y - (op.height || 0)
      
      switch (op.type) {
        case 'text':
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          page.drawText(op.text || '', {
            x: op.x,
            y: pdfY,
            size: op.fontSize || 12,
            font,
            color: rgb(op.color?.[0] || 0, op.color?.[1] || 0, op.color?.[2] || 0),
          })
          break
          
        case 'rectangle':
          page.drawRectangle({
            x: op.x,
            y: pdfY,
            width: op.width || 100,
            height: op.height || 50,
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
          })
          break
          
        case 'delete':
          // Cover with white rectangle
          page.drawRectangle({
            x: op.x,
            y: pdfY,
            width: op.width || 100,
            height: op.height || 50,
            color: rgb(1, 1, 1),
          })
          break
      }
    }
    
    // Save and return
    const editedPdfBytes = await pdfDoc.save()
    const editedBase64 = btoa(String.fromCharCode(...editedPdfBytes))
    
    return new Response(
      JSON.stringify({ pdfBase64: editedBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('PDF editing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Test it:** After deploy, test with a simple PDF.

---

#### 1.3 Basic React Component (2 hours)

**File:** `src/components/pdf-editor/SimplePDFEditor.tsx`

```typescript
import { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Operation {
  type: 'text' | 'rectangle' | 'delete'
  pageIndex: number
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  fontSize?: number
  color?: [number, number, number]
}

export default function SimplePDFEditor() {
  const [pdfFile, setPdfFile] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string>('')
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [operations, setOperations] = useState<Operation[]>([])
  const [tool, setTool] = useState<'text' | 'rectangle' | 'delete'>('text')
  const [textInput, setTextInput] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      setPdfBase64(base64)
      setPdfFile(URL.createObjectURL(file))
      toast.success('PDF loaded!')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newOp: Operation = {
      type: tool,
      pageIndex: currentPage - 1,
      x,
      y,
      width: 100,
      height: 50,
    }

    if (tool === 'text') {
      newOp.text = textInput || 'Sample Text'
      newOp.fontSize = 14
      newOp.color = [0, 0, 0]
    }

    setOperations([...operations, newOp])
    toast.info(`Added ${tool} at (${Math.round(x)}, ${Math.round(y)})`)
  }

  const applyEdits = async () => {
    if (!pdfBase64) {
      toast.error('No PDF loaded')
      return
    }

    toast.loading('Applying edits...')

    try {
      const { data, error } = await supabase.functions.invoke('pdf-editor', {
        body: { pdfBase64, operations }
      })

      if (error) throw error

      // Create new blob from edited PDF
      const binaryString = atob(data.pdfBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'application/pdf' })
      
      setPdfFile(URL.createObjectURL(blob))
      setPdfBase64(data.pdfBase64)
      setOperations([])
      toast.success('Edits applied!')
    } catch (error: any) {
      console.error(error)
      toast.error(`Failed to apply edits: ${error.message}`)
    }
  }

  const downloadPDF = () => {
    if (!pdfFile) return
    const a = document.createElement('a')
    a.href = pdfFile
    a.download = 'edited-document.pdf'
    a.click()
  }

  return (
    <div className="flex flex-col h-screen p-4">
      {/* Toolbar */}
      <div className="flex gap-2 mb-4 p-4 bg-muted rounded-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          Upload PDF
        </Button>
        
        {pdfFile && (
          <>
            <Button 
              variant={tool === 'text' ? 'default' : 'outline'}
              onClick={() => setTool('text')}
            >
              Add Text
            </Button>
            <Button 
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              onClick={() => setTool('rectangle')}
            >
              Add Rectangle
            </Button>
            <Button 
              variant={tool === 'delete' ? 'default' : 'outline'}
              onClick={() => setTool('delete')}
            >
              Delete (White Box)
            </Button>
            
            {tool === 'text' && (
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="px-3 py-2 border rounded"
              />
            )}
            
            <Button onClick={applyEdits} variant="default">
              Apply Edits ({operations.length})
            </Button>
            <Button onClick={downloadPDF} variant="secondary">
              Download
            </Button>
          </>
        )}
      </div>

      {/* PDF Viewer */}
      {pdfFile && (
        <div className="flex-1 overflow-auto border rounded-lg">
          <div onClick={handleCanvasClick} className="cursor-crosshair">
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              <Page pageNumber={currentPage} width={800} />
            </Document>
          </div>
          
          <div className="flex gap-2 justify-center mt-4">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="py-2 px-4">
              Page {currentPage} of {numPages}
            </span>
            <Button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage === numPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

#### 1.4 Add to LightPaper (15 min)

Update `src/pages/LightPaper.tsx`:

```typescript
import SimplePDFEditor from '@/components/pdf-editor/SimplePDFEditor'

// In your tabs, replace the PDF tab content with:
<TabsContent value="pdf">
  <SimplePDFEditor />
</TabsContent>
```

---

### ✅ Step 1 Complete When:
- [ ] You can upload a PDF
- [ ] You can click to add text
- [ ] You can click "Apply Edits" and see changes
- [ ] You can download the edited PDF

**Time Investment:** ~4-5 hours

---

## 🎯 STEP 2: Real-Time Preview (Week 2)
**Goal:** See edits immediately without clicking "Apply"

### What You're Building
- Canvas overlay for instant visual feedback
- Undo/redo functionality
- Better UI/UX

### Actions

#### 2.1 Add Canvas Overlay (2 hours)

```typescript
// Add to SimplePDFEditor.tsx
const canvasRef = useRef<HTMLCanvasElement>(null)
const [scale, setScale] = useState(1)

// Draw operations on canvas
useEffect(() => {
  if (!canvasRef.current) return
  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw all operations for current page
  operations
    .filter(op => op.pageIndex === currentPage - 1)
    .forEach(op => {
      switch (op.type) {
        case 'text':
          ctx.font = `${op.fontSize}px Arial`
          ctx.fillStyle = `rgb(${op.color?.join(',')})`
          ctx.fillText(op.text || '', op.x, op.y)
          break
        case 'rectangle':
          ctx.strokeStyle = 'black'
          ctx.lineWidth = 2
          ctx.strokeRect(op.x, op.y, op.width || 100, op.height || 50)
          break
        case 'delete':
          ctx.fillStyle = 'white'
          ctx.fillRect(op.x, op.y, op.width || 100, op.height || 50)
          break
      }
    })
}, [operations, currentPage])

// Update JSX to include canvas overlay
<div className="relative">
  <Document file={pdfFile} onLoadSuccess={onDocumentLoad}>
    <Page pageNumber={currentPage} width={800} />
  </Document>
  <canvas
    ref={canvasRef}
    width={800}
    height={1000}
    className="absolute top-0 left-0 pointer-events-none"
  />
</div>
```

---

#### 2.2 Add Undo/Redo (1 hour)

```typescript
// Add state
const [history, setHistory] = useState<Operation[][]>([])
const [historyIndex, setHistoryIndex] = useState(-1)

// When adding operation
const addOperation = (op: Operation) => {
  const newOps = [...operations, op]
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(newOps)
  setHistory(newHistory)
  setHistoryIndex(newHistory.length - 1)
  setOperations(newOps)
}

// Undo/Redo handlers
const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1)
    setOperations(history[historyIndex - 1] || [])
  }
}

const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1)
    setOperations(history[historyIndex + 1])
  }
}

// Add buttons
<Button onClick={undo} disabled={historyIndex <= 0}>
  Undo (Ctrl+Z)
</Button>
<Button onClick={redo} disabled={historyIndex >= history.length - 1}>
  Redo (Ctrl+Y)
</Button>

// Add keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault()
      undo()
    } else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault()
      redo()
    }
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [historyIndex, history])
```

---

#### 2.3 Save to Database (30 min)

```typescript
const saveToDB = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('pdf_editing_sessions')
    .upsert({
      user_id: user.id,
      title: 'My PDF Document',
      original_pdf_path: 'temp/original.pdf',
      operations: operations,
    })

  if (error) {
    toast.error('Failed to save')
  } else {
    toast.success('Saved!')
  }
}
```

---

### ✅ Step 2 Complete When:
- [ ] You see edits immediately on canvas overlay
- [ ] Undo/redo works perfectly
- [ ] Can save sessions to database
- [ ] Can load previous sessions

**Time Investment:** ~4-5 hours

---

## 🎯 STEP 3: Advanced Features (Week 3-4)
**Goal:** Text editing, images, smart selection

### Actions

#### 3.1 Text Extraction & Smart Click (4 hours)

This is the hardest part. You need to:

1. **Extract text positions from PDF:**
```typescript
import * as pdfjsLib from 'pdfjs-dist'

async function extractTextWithPositions(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum)
  const textContent = await page.getTextContent()
  
  return textContent.items.map(item => ({
    text: item.str,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
    height: item.height,
    font: item.fontName,
  }))
}
```

2. **Detect clicks on text:**
```typescript
const handleTextClick = (x, y) => {
  const clickedText = textItems.find(item => 
    x >= item.x && 
    x <= item.x + item.width &&
    y >= item.y && 
    y <= item.y + item.height
  )
  
  if (clickedText) {
    // Show text editor modal
    setEditingText(clickedText)
  }
}
```

3. **Edit text in place:**
- Cover old text with white rectangle
- Draw new text on top

---

#### 3.2 Image Support (2 hours)

```typescript
// Add image upload
const [imageData, setImageData] = useState<string>('')

const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    setImageData(e.target?.result as string)
  }
  reader.readAsDataURL(file)
}

// Update edge function to handle images
case 'image':
  if (op.imageData) {
    const imageBytes = Uint8Array.from(
      atob(op.imageData.split(',')[1]), 
      c => c.charCodeAt(0)
    )
    const image = await pdfDoc.embedPng(imageBytes) // or embedJpg
    page.drawImage(image, {
      x: op.x,
      y: pdfY,
      width: op.width,
      height: op.height,
    })
  }
  break
```

---

#### 3.3 Form Fields (2 hours)

```typescript
// Detect and edit form fields
const form = pdfDoc.getForm()
const fields = form.getFields()

fields.forEach(field => {
  const name = field.getName()
  const type = field.constructor.name
  
  if (type === 'PDFTextField') {
    const textField = form.getTextField(name)
    textField.setText('New Value')
  }
})
```

---

### ✅ Step 3 Complete When:
- [ ] Can click on text to edit it
- [ ] Can add images to PDF
- [ ] Can edit form fields
- [ ] All operations work smoothly

**Time Investment:** ~8-10 hours

---

## 🎯 STEP 4: Polish & Production (Week 5-6)
**Goal:** Make it production-ready

### Actions

#### 4.1 Collaboration (Optional, 3 hours)

```sql
-- Add cursors table
CREATE TABLE pdf_collaboration_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES pdf_editing_sessions,
  user_id UUID REFERENCES auth.users,
  page_index INTEGER,
  x FLOAT,
  y FLOAT,
  color TEXT,
  user_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_collaboration_cursors;
```

```typescript
// In React component
const channel = supabase
  .channel(`pdf-${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pdf_collaboration_cursors'
  }, (payload) => {
    updateCursors(payload)
  })
  .subscribe()
```

---

#### 4.2 Performance Optimization (2 hours)

1. **Lazy load pages:**
```typescript
const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([1]))

// Only render visible pages
{Array.from(loadedPages).map(pageNum => (
  <Page key={pageNum} pageNumber={pageNum} />
))}
```

2. **Web Worker for processing:**
```typescript
// Create worker file: public/pdf-worker.js
self.onmessage = async (e) => {
  const { pdfBase64, operations } = e.data
  // Process PDF here
  self.postMessage({ result: editedPdfBase64 })
}

// Use in component
const worker = new Worker('/pdf-worker.js')
worker.postMessage({ pdfBase64, operations })
worker.onmessage = (e) => {
  setPdfFile(e.data.result)
}
```

---

#### 4.3 UI Polish (2 hours)

- Add loading states
- Better error handling
- Tooltips and help text
- Mobile responsiveness
- Keyboard shortcuts guide

---

#### 4.4 Testing (2 hours)

Test with:
- Simple 1-page PDFs
- Complex multi-page documents
- PDFs with images
- PDFs with forms
- Scanned PDFs
- Password-protected PDFs

---

### ✅ Step 4 Complete When:
- [ ] No console errors
- [ ] Works on mobile
- [ ] Fast performance (< 100ms operations)
- [ ] Users can collaborate (if implemented)
- [ ] Production-ready

**Time Investment:** ~6-8 hours

---

## 📊 Total Time Breakdown

| Step | Focus | Hours |
|------|-------|-------|
| Step 1 | Foundation | 4-5 |
| Step 2 | Real-time preview | 4-5 |
| Step 3 | Advanced features | 8-10 |
| Step 4 | Polish & production | 6-8 |
| **TOTAL** | | **22-28 hours** |

---

## 🚨 Common Issues & Fixes

### Issue 1: "PDF.js worker not found"
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
```

### Issue 2: "CORS error calling edge function"
Add to edge function:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Issue 3: "PDF coordinates are wrong"
PDF uses bottom-left origin, you use top-left:
```typescript
const pdfY = pageHeight - y - height
```

### Issue 4: "Large PDFs crash the app"
Implement pagination and only load visible pages.

---

## 🎯 Priority Order

If you're short on time, do in this order:
1. ✅ Basic PDF loading & text adding (Step 1)
2. ✅ Real-time canvas overlay (Step 2.1)
3. ✅ Undo/redo (Step 2.2)
4. ✅ Text editing (Step 3.1)
5. ⏭️ Images (Step 3.2) - can skip
6. ⏭️ Collaboration (Step 4.1) - can skip

---

## 🔥 Quick Start Commands

```bash
# 1. Create database tables
# Use Lovable migration tool with SQL from Step 1.1

# 2. Create edge function
# Create file: supabase/functions/pdf-editor/index.ts
# Copy code from Step 1.2

# 3. Create component
# Create file: src/components/pdf-editor/SimplePDFEditor.tsx
# Copy code from Step 1.3

# 4. Test it
# Upload a PDF, add text, click Apply, download
```

---

## 🎓 Learning Resources

- **pdf-lib docs:** https://pdf-lib.js.org/
- **PDF.js docs:** https://mozilla.github.io/pdf.js/
- **Supabase edge functions:** https://supabase.com/docs/guides/functions

---

## ✨ Final Tips

1. **Start simple:** Don't try to build everything at once
2. **Test frequently:** After each feature, test it
3. **Use console.log:** Debug liberally
4. **Save your work:** Commit to git after each step
5. **Ask for help:** If stuck > 30 min, ask the AI

---

**You've got this!** Start with Step 1 and you'll have a working PDF editor in a weekend.
