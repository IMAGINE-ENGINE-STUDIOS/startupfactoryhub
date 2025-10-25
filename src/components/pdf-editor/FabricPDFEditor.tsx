import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFFabricManager } from '@/lib/pdf/fabricManager';
import { FabricToolbar } from './FabricToolbar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const FabricPDFEditor = () => {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const fabricManager = useRef<PDFFabricManager>(new PDFFabricManager());
  const pageRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Please select a PDF file', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(fileName);

      const { data: session, error: sessionError } = await supabase
        .from('pdf_editing_sessions')
        .insert({
          user_id: user.id,
          pdf_url: publicUrl,
          title: file.name,
          session_data: {}
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);
      setPdfFile(publicUrl);
      toast({ title: 'PDF uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Failed to upload PDF', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageRenderSuccess = (pageNumber: number, width: number, height: number) => {
    const canvasEl = pageRefs.current.get(pageNumber);
    if (!canvasEl) return;

    const scale = zoom;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    fabricManager.current.createCanvas(canvasEl, pageNumber, scaledWidth, scaledHeight);
  };

  const handleSave = async () => {
    if (!sessionId) return;

    setSaving(true);
    try {
      const allJSON = fabricManager.current.exportAllToJSON();
      
      const { error } = await supabase
        .from('pdf_editing_sessions')
        .update({ session_data: allJSON, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      toast({ title: 'Changes saved successfully' });
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save changes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!sessionId || !pdfFile) return;

    setExporting(true);
    try {
      const pageImages: Record<number, string> = {};
      
      for (let i = 1; i <= numPages; i++) {
        const canvas = fabricManager.current.getCanvas(i);
        if (canvas && canvas.getObjects().length > 0) {
          pageImages[i] = canvas.toDataURL({ multiplier: 1, format: 'png' });
        }
      }

      const { data, error } = await supabase.functions.invoke('pdf-manipulation', {
        body: {
          sessionId,
          pdfUrl: pdfFile,
          pageImages
        }
      });

      if (error) throw error;

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = `edited_${Date.now()}.pdf`;
        link.click();
        toast({ title: 'PDF exported successfully' });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Failed to export PDF', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const loadSession = async (loadSessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_editing_sessions')
        .select('*')
        .eq('id', loadSessionId)
        .single();

      if (error) throw error;

      setPdfFile(data.pdf_url);
      setSessionId(data.id);

      if (data.session_data && Object.keys(data.session_data).length > 0) {
        setTimeout(() => {
          fabricManager.current.loadAllFromJSON(data.session_data as Record<number, string>);
        }, 1000);
      }
    } catch (error) {
      console.error('Load session error:', error);
      toast({ title: 'Failed to load session', variant: 'destructive' });
    }
  };

  useEffect(() => {
    return () => {
      fabricManager.current.disposeAll();
    };
  }, []);

  if (!pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <h2 className="text-2xl font-bold text-foreground">Upload a PDF to start editing</h2>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose PDF File'}
          </Button>
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <FabricToolbar
        fabricManager={fabricManager.current}
        currentPage={currentPage}
        zoom={zoom}
        onZoomChange={setZoom}
        onSave={handleSave}
        onExport={handleExport}
        saving={saving}
        exporting={exporting}
      />

      <div className="flex-1 overflow-auto p-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>}
          >
            {Array.from({ length: numPages }, (_, i) => {
              const pageNum = i + 1;
              return (
                <div
                  key={pageNum}
                  ref={(el) => el && containerRefs.current.set(pageNum, el)}
                  className="relative mb-8 shadow-lg"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                >
                  <Page
                    pageNumber={pageNum}
                    onRenderSuccess={(page) => {
                      onPageRenderSuccess(pageNum, page.width, page.height);
                    }}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  <canvas
                    ref={(el) => el && pageRefs.current.set(pageNum, el)}
                    className="absolute top-0 left-0 cursor-crosshair"
                    onClick={(e) => {
                      setCurrentPage(pageNum);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      fabricManager.current.addText(pageNum, x, y);
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-background/90 px-2 py-1 rounded text-sm">
                    Page {pageNum}
                  </div>
                </div>
              );
            })}
          </Document>
        </div>
      </div>
    </div>
  );
};
