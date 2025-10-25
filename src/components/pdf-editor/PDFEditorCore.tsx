import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, ZoomIn, ZoomOut, Download, Save, 
  Type, Square, Circle, Pencil, Eraser, MousePointer,
  Image as ImageIcon, FileText
} from 'lucide-react';
import { PDFFabricManager } from '@/lib/pdf/fabricManager';
import { PDFExporter } from '@/lib/pdf/pdfExporter';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFEditorCoreProps {
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export const PDFEditorCore = ({ sessionId, onSessionCreated }: PDFEditorCoreProps) => {
  const [pdfFile, setPdfFile] = useState<File | string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'draw' | 'rect' | 'circle' | 'erase'>('select');
  const [activeColor, setActiveColor] = useState<string>('#000000');
  const [fontSize, setFontSize] = useState<number>(16);
  const [loading, setLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState<string>('Untitled Document');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fabricManagerRef = useRef<PDFFabricManager>(new PDFFabricManager());
  const pdfExporterRef = useRef<PDFExporter>(new PDFExporter());
  const pageRefsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefsRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
  }, [sessionId]);

  useEffect(() => () => fabricManagerRef.current.disposeAll(), []);
  useEffect(() => fabricManagerRef.current.setTool(activeTool), [activeTool]);
  useEffect(() => fabricManagerRef.current.setColor(activeColor), [activeColor]);
  useEffect(() => fabricManagerRef.current.setFontSize(fontSize), [fontSize]);

  const handleCanvasClick = (pageNumber: number, event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefsRef.current.get(pageNumber);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (activeTool === 'text') fabricManagerRef.current.addText(pageNumber, x, y);
    else if (activeTool === 'rect') fabricManagerRef.current.addRectangle(pageNumber);
    else if (activeTool === 'circle') fabricManagerRef.current.addCircle(pageNumber);
    else if (activeTool === 'erase') fabricManagerRef.current.deleteSelected(pageNumber);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF file');
      return;
    }

    setPdfFile(file);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error('Please sign in to edit PDFs');
      return;
    }

    try {
      setLoading(true);
      const fileName = `pdfs/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('pdf-documents').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('pdf-documents').getPublicUrl(fileName);
      const { data: session, error: sessionError } = await supabase
        .from('pdf_editing_sessions')
        .insert({ user_id: user.id, pdf_url: publicUrl, title: file.name, session_data: {} })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setCurrentSessionId(session.id);
      setSessionTitle(file.name);
      onSessionCreated?.(session.id);
      toast.success('PDF uploaded successfully!');
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('pdf_editing_sessions').select('*').eq('id', id).single();
      if (error) throw error;

      setPdfFile(data.pdf_url);
      setSessionTitle(data.title);
      setCurrentSessionId(data.id);

      if (data.session_data) {
        setTimeout(() => {
          fabricManagerRef.current.loadAllFromJSON(data.session_data as Record<number, string>);
          toast.success('Session loaded');
        }, 500);
      }
    } catch (error) {
      console.error('❌ Load error:', error);
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentSessionId) {
      toast.error('No active session');
      return;
    }

    try {
      setLoading(true);
      const sessionData = fabricManagerRef.current.exportAllToJSON();
      const { error } = await supabase
        .from('pdf_editing_sessions')
        .update({ session_data: sessionData, updated_at: new Date().toISOString() })
        .eq('id', currentSessionId);

      if (error) throw error;
      fabricManagerRef.current.clearDirtyFlags();
      toast.success('Session saved!');
    } catch (error) {
      console.error('❌ Save error:', error);
      toast.error('Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!pdfFile || numPages === 0) {
      toast.error('No PDF loaded');
      return;
    }

    try {
      setLoading(true);
      toast.info('Exporting PDF...');
      const pageElements: HTMLDivElement[] = [];
      const canvasElements: HTMLCanvasElement[] = [];

      for (let i = 1; i <= numPages; i++) {
        const pageDiv = pageRefsRef.current.get(i);
        const canvas = canvasRefsRef.current.get(i);
        if (pageDiv) pageElements.push(pageDiv);
        if (canvas) canvasElements.push(canvas);
      }

      await pdfExporterRef.current.exportAndDownload(pageElements, canvasElements, { filename: sessionTitle || 'edited-document.pdf' });
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      try {
        await fabricManagerRef.current.addImage(1, imageUrl);
        toast.success('Image added');
      } catch (error) {
        toast.error('Failed to add image');
      }
    };
    reader.readAsDataURL(file);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);

  const onPageRenderSuccess = (pageNumber: number) => {
    const canvasRef = canvasRefsRef.current.get(pageNumber);
    const pageDiv = pageRefsRef.current.get(pageNumber);
    if (!canvasRef || !pageDiv) return;

    const pdfCanvas = pageDiv.querySelector('canvas');
    if (!pdfCanvas) return;

    const width = pdfCanvas.width / window.devicePixelRatio;
    const height = pdfCanvas.height / window.devicePixelRatio;
    fabricManagerRef.current.createCanvas(canvasRef, pageNumber, width, height);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Card className="border-b rounded-none">
        <div className="flex items-center gap-2 p-3 flex-wrap">
          <div className="flex items-center gap-2 border-r pr-3">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              <Upload className="w-4 h-4 mr-2" />Upload PDF
            </Button>
            <Input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
          </div>

          {pdfFile && (
            <>
              <div className="flex items-center gap-1 border-r pr-3">
                <Button variant={activeTool === 'select' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTool('select')}><MousePointer className="w-4 h-4" /></Button>
                <Button variant={activeTool === 'text' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTool('text')}><Type className="w-4 h-4" /></Button>
                <Button variant={activeTool === 'draw' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTool('draw')}><Pencil className="w-4 h-4" /></Button>
                <Button variant={activeTool === 'rect' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTool('rect')}><Square className="w-4 h-4" /></Button>
                <Button variant={activeTool === 'circle' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTool('circle')}><Circle className="w-4 h-4" /></Button>
                <Button variant={activeTool === 'erase' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTool('erase')}><Eraser className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => imageInputRef.current?.click()}><ImageIcon className="w-4 h-4" /></Button>
                <Input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              <div className="flex items-center gap-2 border-r pr-3">
                <Input type="color" value={activeColor} onChange={(e) => setActiveColor(e.target.value)} className="w-12 h-8 p-1" />
                <Input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min="8" max="72" className="w-16 h-8" />
              </div>

              <div className="flex items-center gap-1 border-r pr-3">
                <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
                <span className="text-sm min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={loading}><Save className="w-4 h-4 mr-2" />Save</Button>
                <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}><Download className="w-4 h-4 mr-2" />Export</Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        {!pdfFile ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">No PDF loaded</p>
            <p className="text-sm">Upload a PDF to start editing</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages), (_, index) => {
                const pageNumber = index + 1;
                return (
                  <div key={pageNumber} className="relative mb-8 shadow-lg">
                    <div ref={(el) => { if (el) pageRefsRef.current.set(pageNumber, el); }} className="relative bg-white">
                      <Page pageNumber={pageNumber} scale={zoom} onRenderSuccess={() => onPageRenderSuccess(pageNumber)} />
                      <canvas
                        ref={(el) => { if (el) canvasRefsRef.current.set(pageNumber, el); }}
                        onClick={(e) => handleCanvasClick(pageNumber, e)}
                        className="absolute top-0 left-0 cursor-crosshair"
                        style={{ pointerEvents: activeTool !== 'select' ? 'auto' : 'none' }}
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground mt-2">Page {pageNumber} of {numPages}</div>
                  </div>
                );
              })}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFEditorCore;
