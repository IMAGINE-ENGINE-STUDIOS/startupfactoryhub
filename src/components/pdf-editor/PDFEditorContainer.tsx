import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFBackgroundLayer } from './PDFBackgroundLayer';
import { PDFFabricCanvas } from './PDFFabricCanvas';
import { PDFToolbar } from './PDFToolbar';
import { PDFPropertiesPanel } from './PDFPropertiesPanel';
import { FabricCanvasManager } from '@/lib/pdf/FabricCanvasManager';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { usePDFSession } from '@/hooks/usePDFSession';
import { usePDFAutoSave } from '@/hooks/usePDFAutoSave';
import { usePDFExport } from '@/hooks/usePDFExport';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const PDFEditorContainer = () => {
  const { pdfUrl, setPdfUrl, setTotalPages, currentPage, reset } = usePDFEditorStore();
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [fabricJSON, setFabricJSON] = useState<string | null>(null);
  const fabricManagerRef = useRef<FabricCanvasManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session management
  const { sessionId, isLoading: isLoadingSession } = usePDFSession(pdfUrl);
  
  // Auto-save
  usePDFAutoSave(sessionId, fabricJSON, currentPage);
  
  // Export
  const { exportPDF, isExporting, exportUrl } = usePDFExport();

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    try {
      toast.loading('Uploading PDF...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to upload PDFs');
        return;
      }

      // Upload to Supabase Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(data.path);

      reset();
      setPdfUrl(publicUrl);
      toast.success('PDF uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF: ' + error.message);
    }
  };

  const handleLoadSuccess = useCallback((numPages: number) => {
    setTotalPages(numPages);
    toast.success(`PDF loaded with ${numPages} pages`);
  }, [setTotalPages]);

  const handlePageLoadSuccess = useCallback((width: number, height: number) => {
    setCanvasDimensions({ width, height });
  }, []);

  const handleManagerReady = useCallback((manager: FabricCanvasManager) => {
    fabricManagerRef.current = manager;
    
    // Set selection change callback
    manager.setSelectionChangeCallback((obj) => {
      setSelectedObject(obj);
    });

    // Set up auto-save on canvas changes
    manager.getCanvas().on('object:modified', () => {
      setFabricJSON(manager.serializeCanvas());
    });
    
    manager.getCanvas().on('object:added', () => {
      setFabricJSON(manager.serializeCanvas());
    });
    
    manager.getCanvas().on('object:removed', () => {
      setFabricJSON(manager.serializeCanvas());
    });
  }, []);

  const handleUpdateProperty = useCallback((property: string, value: any) => {
    fabricManagerRef.current?.updateSelectedObjectProperty(property, value);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    fabricManagerRef.current?.deleteSelected();
    setSelectedObject(null);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricManagerRef.current) return;

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        fabricManagerRef.current.undo();
        toast.info('Undo');
      }
      
      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        fabricManagerRef.current.redo();
        toast.info('Redo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = useCallback(async () => {
    if (!fabricManagerRef.current || !sessionId || !pdfUrl) {
      toast.error('No canvas to export');
      return;
    }

    const canvas = fabricManagerRef.current.getCanvas();
    const objects = canvas.getObjects();
    
    if (objects.length === 0) {
      toast.error('No objects to export');
      return;
    }

    const url = await exportPDF(
      sessionId,
      pdfUrl,
      objects,
      canvasDimensions.height,
      currentPage
    );

    if (url) {
      // Automatically download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edited-pdf.pdf';
      link.click();
    }
  }, [sessionId, pdfUrl, canvasDimensions.height, currentPage, exportPDF]);

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <PDFToolbar 
        onUpload={handleUpload} 
        onExport={handleExport}
        isExporting={isExporting}
        hasSession={!!sessionId}
      />
      
      {exportUrl && (
        <div className="px-4 py-2 bg-success/10 border-b border-success/20">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <span className="text-sm text-success-foreground">
              PDF exported successfully!
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(exportUrl, '_blank')}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto flex gap-4 p-4">
        <div className="flex-1 overflow-auto">
          {!pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-semibold">No PDF loaded</h3>
                <p className="text-muted-foreground">
                  Click "Upload PDF" to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div 
                className="relative bg-white shadow-2xl"
                style={{
                  width: canvasDimensions.width || 'auto',
                  height: canvasDimensions.height || 'auto',
                }}
              >
                <PDFBackgroundLayer
                  pdfUrl={pdfUrl}
                  pageNumber={currentPage}
                  zoom={1}
                  onLoadSuccess={handleLoadSuccess}
                  onPageLoadSuccess={handlePageLoadSuccess}
                />
                
                {canvasDimensions.width > 0 && canvasDimensions.height > 0 && (
                  <PDFFabricCanvas
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    onManagerReady={handleManagerReady}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {pdfUrl && (
          <div className="flex-shrink-0">
            <PDFPropertiesPanel
              selectedObject={selectedObject}
              onUpdateProperty={handleUpdateProperty}
              onDelete={handleDeleteSelected}
            />
          </div>
        )}
      </div>
    </div>
  );
};
