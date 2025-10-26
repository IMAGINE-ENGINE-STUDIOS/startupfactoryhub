import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, Save, Download, Undo, Redo, Type, Square, 
  Eraser, MousePointer, ZoomIn, ZoomOut, Loader2 
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Simple operation structure
interface Operation {
  type: 'add_text' | 'add_rectangle' | 'delete_content';
  page: number;
  x: number;
  y: number;
  data: {
    text?: string;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    width?: number;
    height?: number;
  };
}

interface SimplePDFEditorProps {
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function SimplePDFEditor({ sessionId: initialSessionId, onSessionCreated }: SimplePDFEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // State
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [history, setHistory] = useState<Operation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'rectangle' | 'erase'>('select');
  const [textInput, setTextInput] = useState<string>('Sample Text');
  const [fontSize, setFontSize] = useState<number>(14);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [documentTitle, setDocumentTitle] = useState<string>('Untitled PDF');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Load session if provided
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [historyIndex, history]);

  // Redraw canvas when operations change
  useEffect(() => {
    drawOperations();
  }, [operations, currentPage, zoom]);

  const loadSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_editing_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      if (data) {
        setPdfFile(data.pdf_url);
        setDocumentTitle(data.title || 'Untitled PDF');
        
        // Load operations from session_data
        if (data.session_data && typeof data.session_data === 'object') {
          const allOps: Operation[] = [];
          Object.entries(data.session_data).forEach(([pageNum, fabricJSON]) => {
            // For now, we'll skip loading old Fabric data
            // Future: could convert Fabric JSON to our operations format
          });
          if (allOps.length > 0) {
            setOperations(allOps);
            setHistory([[...allOps]]);
            setHistoryIndex(0);
          }
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load PDF session',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'PDF must be under 20MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileName = `pdf-sessions/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create signed URL
      const { data: urlData } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(fileName, 604800); // 7 days

      if (!urlData) throw new Error('Failed to create signed URL');

      setPdfFile(urlData.signedUrl);
      setDocumentTitle(file.name.replace('.pdf', ''));

      // Create session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('pdf_editing_sessions')
        .insert({
          user_id: user.id,
          pdf_url: fileName, // Store path, not signed URL
          title: file.name.replace('.pdf', ''),
          session_data: {},
          is_active: true,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(sessionData.id);
      onSessionCreated?.(sessionData.id);

      toast({
        title: 'Success',
        description: 'PDF uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload PDF',
        variant: 'destructive',
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    if (activeTool === 'select') return;

    const container = containerRefs.current.get(pageNumber);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    let newOp: Operation | null = null;

    switch (activeTool) {
      case 'text':
        newOp = {
          type: 'add_text',
          page: pageNumber - 1,
          x,
          y,
          data: {
            text: textInput,
            fontSize,
            color: { r: 0, g: 0, b: 0 },
          },
        };
        break;

      case 'rectangle':
        newOp = {
          type: 'add_rectangle',
          page: pageNumber - 1,
          x,
          y,
          data: {
            width: 100,
            height: 50,
            color: { r: 0, g: 0, b: 1 },
          },
        };
        break;

      case 'erase':
        newOp = {
          type: 'delete_content',
          page: pageNumber - 1,
          x,
          y,
          data: {
            width: 100,
            height: 50,
          },
        };
        break;
    }

    if (newOp) {
      addOperation(newOp);
      toast({
        title: 'Operation added',
        description: `${activeTool} added to page ${pageNumber}`,
      });
    }
  };

  const addOperation = (op: Operation) => {
    const newOps = [...operations, op];
    setOperations(newOps);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newOps]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setOperations([...history[historyIndex - 1]]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setOperations([...history[historyIndex + 1]]);
    }
  };

  const handleSave = async () => {
    if (!sessionId) {
      toast({
        title: 'No session',
        description: 'Please upload a PDF first',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('pdf_editing_sessions')
        .update({
          session_data: { operations } as any,
          title: documentTitle,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!sessionId || !pdfFile || operations.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'Add some edits first',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get PDF path from session
      const { data: sessionData } = await supabase
        .from('pdf_editing_sessions')
        .select('pdf_url')
        .eq('id', sessionId)
        .single();

      const response = await supabase.functions.invoke('pdf-manipulation', {
        body: {
          sessionId,
          operations,
          pdfUrl: sessionData?.pdf_url || pdfFile,
        },
      });

      if (response.error) throw response.error;

      const { signedUrl } = response.data;
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `${documentTitle}-edited.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const drawOperations = () => {
    // Draw operations on canvas overlay for current page
    const canvas = canvasRefs.current.get(currentPage);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw operations for current page
    const pageOps = operations.filter(op => op.page === currentPage - 1);
    
    pageOps.forEach(op => {
      ctx.save();
      ctx.scale(zoom, zoom);

      switch (op.type) {
        case 'add_text':
          ctx.font = `${op.data.fontSize}px Arial`;
          ctx.fillStyle = '#000000';
          ctx.fillText(op.data.text || '', op.x, op.y);
          break;

        case 'add_rectangle':
          ctx.strokeStyle = '#0000ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(op.x, op.y, op.data.width || 100, op.data.height || 50);
          break;

        case 'delete_content':
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(op.x, op.y, op.data.width || 100, op.data.height || 50);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(op.x, op.y, op.data.width || 100, op.data.height || 50);
          break;
      }

      ctx.restore();
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b bg-card p-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload PDF
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Tools */}
        <Button
          variant={activeTool === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('select')}
          title="Select (V)"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('text')}
          title="Text (T)"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('rectangle')}
          title="Rectangle (R)"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={activeTool === 'erase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('erase')}
          title="Erase (E)"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        {activeTool === 'text' && (
          <>
            <Input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text"
              className="w-32 h-8"
            />
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="72"
              className="w-16 h-8"
            />
          </>
        )}

        <div className="h-6 w-px bg-border mx-1" />

        {/* Undo/Redo */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Zoom */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
          disabled={zoom >= 2.0}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Save/Export */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !sessionId}
          className="gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || !sessionId || operations.length === 0}
          className="gap-2"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Apply & Export
        </Button>

        <span className="text-sm text-muted-foreground">
          {operations.length} edit{operations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-muted/20 p-4">
        {!pdfFile ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No PDF loaded</h3>
              <p className="text-muted-foreground mb-4">Upload a PDF to get started</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  ref={(el) => el && containerRefs.current.set(pageNum, el)}
                  className="relative mb-8 shadow-xl bg-white inline-block"
                  onClick={(e) => handleCanvasClick(e, pageNum)}
                  style={{
                    cursor: activeTool === 'select' ? 'default' : 
                           activeTool === 'text' ? 'text' : 'crosshair',
                  }}
                >
                  <Page
                    pageNumber={pageNum}
                    scale={zoom}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderSuccess={(page) => {
                      const canvas = canvasRefs.current.get(pageNum);
                      if (canvas) {
                        canvas.width = page.width;
                        canvas.height = page.height;
                        if (pageNum === currentPage) {
                          drawOperations();
                        }
                      }
                    }}
                  />
                  <canvas
                    ref={(el) => el && canvasRefs.current.set(pageNum, el)}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ opacity: 0.9 }}
                  />
                </div>
              ))}
            </Document>

            {/* Page info */}
            {numPages > 0 && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                {numPages} page{numPages !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
