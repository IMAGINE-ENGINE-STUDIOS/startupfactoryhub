import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, Type, Square, Eraser, MousePointer,
  ZoomIn, ZoomOut, Download, Save, Undo, Redo,
  Image as ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Operation {
  type: 'add_text' | 'add_rectangle' | 'delete_content' | 'add_image';
  page: number;
  x: number;
  y: number;
  data?: any;
}

interface SimplePDFEditorProps {
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export default function SimplePDFEditor({ sessionId: initialSessionId, onSessionCreated }: SimplePDFEditorProps) {
  const { user } = useAuth();
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [history, setHistory] = useState<Operation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<'select' | 'text' | 'rectangle' | 'erase'>('select');
  const [textInput, setTextInput] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);
  const [sessionId, setSessionId] = useState<string>(initialSessionId || '');
  const [title, setTitle] = useState<string>('Untitled Document');
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Load session if provided
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId]);

  // Draw operations on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || !pageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to PDF page
    const pageElement = pageRef.current.querySelector('.react-pdf__Page');
    if (pageElement) {
      const rect = pageElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all operations for current page
    operations
      .filter(op => op.page === currentPage - 1)
      .forEach(op => {
        const x = op.x * scale;
        const y = op.y * scale;

        switch (op.type) {
          case 'add_text':
            ctx.font = `${(op.data.fontSize || 14) * scale}px Arial`;
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillText(op.data.text || '', x, y);
            // Draw selection box
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 2;
            const textWidth = ctx.measureText(op.data.text || '').width;
            ctx.strokeRect(x - 4, y - (op.data.fontSize || 14) * scale, textWidth + 8, (op.data.fontSize || 14) * scale + 4);
            break;
            
          case 'add_rectangle':
            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.lineWidth = 2 * scale;
            ctx.strokeRect(x, y, (op.data.width || 100) * scale, (op.data.height || 50) * scale);
            break;
            
          case 'delete_content':
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(x, y, (op.data.width || 100) * scale, (op.data.height || 50) * scale);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, (op.data.width || 100) * scale, (op.data.height || 50) * scale);
            break;
        }
      });
  }, [operations, currentPage, scale]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [historyIndex, history, sessionId]);

  const loadSession = async (sid: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_editing_sessions')
        .select('*')
        .eq('id', sid)
        .single();

      if (error) throw error;

      setSessionId(sid);
      setTitle(data.title || 'Untitled Document');
      
      if (data.pdf_url) {
        setPdfPath(data.pdf_url);
        
        // Create signed URL for display
        const { data: signedData, error: signedError } = await supabase.storage
          .from('pdf-documents')
          .createSignedUrl(data.pdf_url, 3600);

        if (signedError) throw signedError;
        setPdfFile(signedData.signedUrl);
      }

      // Load operations from session_data
      if (data.session_data && typeof data.session_data === 'object') {
        const sessionData = data.session_data as any;
        if (sessionData.operations && Array.isArray(sessionData.operations)) {
          setOperations(sessionData.operations);
        }
      }

      toast.success('Session loaded');
    } catch (error: any) {
      console.error('Load error:', error);
      toast.error('Failed to load session');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      toast.loading('Uploading PDF...');

      // Upload to Supabase Storage
      const filePath = `pdf-sessions/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(filePath, 3600);

      if (signedError) throw signedError;

      setPdfFile(signedData.signedUrl);
      setPdfPath(filePath);

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('pdf_editing_sessions')
        .insert({
          user_id: user.id,
          pdf_url: filePath,
          title: file.name.replace('.pdf', ''),
          session_data: { operations: [] } as any
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);
      setTitle(session.title);
      setOperations([]);
      setHistory([]);
      setHistoryIndex(-1);

      if (onSessionCreated) {
        onSessionCreated(session.id);
      }

      toast.success('PDF uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF');
    }
  };

  const addOperation = (op: Operation) => {
    const newOps = [...operations, op];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newOps);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setOperations(newOps);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setOperations(history[historyIndex - 1] || []);
      toast.info('Undo');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setOperations(history[historyIndex + 1]);
      toast.info('Redo');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newOp: Operation = {
      type: tool === 'text' ? 'add_text' : tool === 'rectangle' ? 'add_rectangle' : 'delete_content',
      page: currentPage - 1,
      x,
      y,
      data: {}
    };

    if (tool === 'text') {
      newOp.data = {
        text: textInput || 'Sample Text',
        fontSize: fontSize,
        color: { r: 0, g: 0, b: 0 }
      };
    } else if (tool === 'rectangle') {
      newOp.data = {
        width: 100,
        height: 50,
        color: { r: 1, g: 1, b: 1 },
        borderColor: { r: 0, g: 0, b: 0 },
        borderWidth: 2
      };
    } else if (tool === 'erase') {
      newOp.data = {
        width: 100,
        height: 50
      };
    }

    addOperation(newOp);
    toast.success(`Added ${tool}`);
  };

  const handleSave = async () => {
    if (!sessionId || !user) {
      toast.error('No session to save');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('pdf_editing_sessions')
        .update({
          session_data: { operations } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Saved successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!pdfPath || !sessionId) {
      toast.error('No PDF to export');
      return;
    }

    try {
      toast.loading('Exporting PDF...');

      const { data, error } = await supabase.functions.invoke('pdf-manipulation', {
        body: {
          sessionId,
          operations,
          pdfUrl: pdfPath
        }
      });

      if (error) throw error;

      // Download the signed URL
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'edited-document'}.pdf`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('PDF exported!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>

          {pdfFile && (
            <>
              <div className="h-6 w-px bg-border mx-2" />
              
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('select')}
              >
                <MousePointer className="w-4 h-4" />
              </Button>
              
              <Button
                variant={tool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('text')}
              >
                <Type className="w-4 h-4" />
              </Button>

              <Button
                variant={tool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('rectangle')}
              >
                <Square className="w-4 h-4" />
              </Button>

              <Button
                variant={tool === 'erase' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('erase')}
              >
                <Eraser className="w-4 h-4" />
              </Button>

              {tool === 'text' && (
                <>
                  <Input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="w-40"
                    size={1}
                  />
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min={8}
                    max={72}
                    className="w-20"
                  />
                </>
              )}

              <div className="h-6 w-px bg-border mx-2" />

              <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </Button>

              <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>

              <div className="h-6 w-px bg-border mx-2" />

              <Button size="sm" variant="outline" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>

              <span className="text-sm">{Math.round(scale * 100)}%</span>

              <Button size="sm" variant="outline" onClick={() => setScale(s => Math.min(3, s + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>

              <div className="h-6 w-px bg-border mx-2" />

              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>

              <Button size="sm" variant="secondary" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* PDF Viewer */}
      {pdfFile ? (
        <div className="flex-1 overflow-auto">
          <div className="flex justify-center">
            <div className="relative inline-block" ref={pageRef}>
              <div onClick={handleCanvasClick} className={tool !== 'select' ? 'cursor-crosshair' : ''}>
                <Document
                  file={pdfFile}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                >
                  <Page 
                    pageNumber={currentPage} 
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              </div>
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
              />
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {numPages}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage === numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Upload a PDF to get started</p>
            <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
              Choose File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
