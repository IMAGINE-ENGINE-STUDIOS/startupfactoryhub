import { useState, useRef, useCallback, useEffect } from 'react';
import { PDFBackgroundLayer } from './PDFBackgroundLayer';
import { PDFFabricCanvas } from './PDFFabricCanvas';
import { PDFToolbar } from './PDFToolbar';
import { PDFPropertiesPanel } from './PDFPropertiesPanel';
import { PDFPageNavigator } from './PDFPageNavigator';
import { PDFZoomControls } from './PDFZoomControls';
import { CollaborationCursors } from './CollaborationCursors';
import { PDFErrorBoundary } from './PDFErrorBoundary';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ExportOptionsDialog } from './ExportOptionsDialog';
import { FabricCanvasManager } from '@/lib/pdf/FabricCanvasManager';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { usePDFSession } from '@/hooks/usePDFSession';
import { usePDFAutoSave } from '@/hooks/usePDFAutoSave';
import { usePDFExport } from '@/hooks/usePDFExport';
import { usePDFRealtime } from '@/hooks/usePDFRealtime';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Download, Upload as UploadIcon, Keyboard as KeyboardIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const PDFEditorContainer = () => {
  const { pdfUrl, setPdfUrl, setTotalPages, currentPage, setCurrentPage, zoom, totalPages, reset } = usePDFEditorStore();
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [fabricJSON, setFabricJSON] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const fabricManagerRef = useRef<FabricCanvasManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Session management
  const { sessionId, isLoading: isLoadingSession } = usePDFSession(pdfUrl);
  
  // Auto-save
  usePDFAutoSave(sessionId, fabricJSON, currentPage);
  
  // Export
  const { exportPDF, isExporting, exportUrl } = usePDFExport();

  // Real-time collaboration
  const { collaborators, updateCursor, isConnected } = usePDFRealtime(sessionId, currentPage);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError('PDF file is too large (max 50MB)');
      toast.error('PDF file is too large. Maximum size is 50MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const toastId = toast.loading('Uploading PDF...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to upload PDFs', { id: toastId });
        return;
      }

      // Upload to Supabase Storage with retry logic
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      let uploadError;
      let uploadData;
      
      // Retry upload up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await supabase.storage
          .from('pdf-documents')
          .upload(filePath, file);
        
        if (!result.error) {
          uploadData = result.data;
          break;
        }
        
        uploadError = result.error;
        if (attempt < 3) {
          console.log(`Upload attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(uploadData!.path);

      reset();
      setPdfUrl(publicUrl);
      toast.success('PDF uploaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error.message || 'Failed to upload PDF';
      setUploadError(errorMsg);
      toast.error(`Failed to upload PDF: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricManagerRef.current) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    try {
      toast.loading('Uploading image...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to upload images');
        return;
      }

      // Upload to Supabase Storage
      const filePath = `${user.id}/images/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(data.path);

      // Add image to canvas at center
      const centerX = canvasDimensions.width / 2 - 100;
      const centerY = canvasDimensions.height / 2 - 100;
      fabricManagerRef.current.addImage(publicUrl, centerX, centerY, 200, 200);

      toast.success('Image added to canvas!');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
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

    // Track mouse movement for collaboration cursors
    manager.getCanvas().on('mouse:move', (event) => {
      if (!sessionId || !event.pointer) return;
      updateCursor(event.pointer.x, event.pointer.y, currentPage);
    });
  }, [sessionId, currentPage, updateCursor]);

  const handleUpdateProperty = useCallback((property: string, value: any) => {
    fabricManagerRef.current?.updateSelectedObjectProperty(property, value);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    fabricManagerRef.current?.deleteSelected();
    setSelectedObject(null);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    toast.info(`Switched to page ${page}`);
  }, [setCurrentPage]);

  // Show collaboration status
  useEffect(() => {
    if (isConnected && sessionId) {
      console.log('Connected to collaboration session');
    }
  }, [isConnected, sessionId]);

  // Keyboard shortcuts for undo/redo and tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricManagerRef.current) return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        fabricManagerRef.current.undo();
        toast.info('Undo');
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        fabricManagerRef.current.redo();
        toast.info('Redo');
        return;
      }

      // Save shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (fabricJSON && sessionId) {
          toast.success('Changes auto-saved');
        } else {
          toast.info('Auto-save is active');
        }
        return;
      }

      // Export shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (sessionId) {
          setShowExportDialog(true);
        } else {
          toast.error('Upload a PDF first');
        }
        return;
      }

      // Keyboard shortcuts dialog
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }

      // Tool shortcuts (only if not in input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { setActiveTool } = usePDFEditorStore.getState();

      switch (e.key.toLowerCase()) {
        case 't':
          setActiveTool('text');
          toast.info('Text tool selected');
          break;
        case 'r':
          setActiveTool('rectangle');
          toast.info('Rectangle tool selected');
          break;
        case 'c':
          setActiveTool('circle');
          toast.info('Circle tool selected');
          break;
        case 'd':
          setActiveTool('draw');
          toast.info('Draw tool selected');
          break;
        case 'e':
          setActiveTool('erase');
          toast.info('Eraser tool selected');
          break;
        case 'v':
          setActiveTool('select');
          toast.info('Select tool activated');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = useCallback(async (filename?: string) => {
    if (!fabricManagerRef.current || !sessionId || !pdfUrl) {
      toast.error('No canvas to export');
      return;
    }

    const canvas = fabricManagerRef.current.getCanvas();
    const objects = canvas.getObjects();
    
    if (objects.length === 0) {
      toast.error('No changes to export. Add some annotations first!');
      return;
    }

    try {
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
        link.download = filename || 'edited-pdf.pdf';
        link.click();
        
        // Close export dialog if open
        setShowExportDialog(false);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message || 'Unknown error'}`);
    }
  }, [sessionId, pdfUrl, canvasDimensions.height, currentPage, exportPDF]);

  return (
    <PDFErrorBoundary>
      <div className="flex flex-col h-full bg-muted/30">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <PDFToolbar 
          onUpload={handleUpload} 
          onExport={() => setShowExportDialog(true)}
          onImageUpload={handleImageUpload}
          onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
          isExporting={isExporting}
          isUploading={isUploading}
          hasSession={!!sessionId}
        />
      
      {uploadError && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

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
        {/* Left sidebar - Page navigator */}
        {pdfUrl && totalPages > 1 && (
          <div className="flex-shrink-0">
            <PDFPageNavigator onPageChange={handlePageChange} />
          </div>
        )}

        {/* Main canvas area */}
        <div className="flex-1 overflow-auto relative">
          {!pdfUrl ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-semibold">No PDF loaded</h3>
                <p className="text-muted-foreground">
                  Click "Upload PDF" to get started
                </p>
              </div>
            </div>
          ) : isLoadingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="space-y-4 w-full max-w-3xl px-8">
                <Skeleton className="h-[600px] w-full" />
                <div className="flex gap-2 justify-center">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Zoom controls */}
              <div className="sticky top-4 z-10">
                <PDFZoomControls
                  canvasWidth={canvasDimensions.width / zoom}
                  canvasHeight={canvasDimensions.height / zoom}
                  containerWidth={800}
                />
              </div>

              {/* PDF Canvas */}
              <div 
                ref={canvasContainerRef}
                className="relative bg-white shadow-2xl"
                style={{
                  width: canvasDimensions.width || 'auto',
                  height: canvasDimensions.height || 'auto',
                }}
              >
                <PDFBackgroundLayer
                  pdfUrl={pdfUrl}
                  pageNumber={currentPage}
                  zoom={zoom}
                  onLoadSuccess={handleLoadSuccess}
                  onPageLoadSuccess={handlePageLoadSuccess}
                />
                
                {canvasDimensions.width > 0 && canvasDimensions.height > 0 && (
                  <>
                    <PDFFabricCanvas
                      width={canvasDimensions.width}
                      height={canvasDimensions.height}
                      onManagerReady={handleManagerReady}
                    />
                    
                    {/* Collaboration cursors overlay */}
                    {isConnected && collaborators.length > 0 && (
                      <CollaborationCursors
                        collaborators={collaborators}
                        currentPage={currentPage}
                        containerRef={canvasContainerRef}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - Properties panel */}
        {pdfUrl && !isLoadingSession && (
          <div className="flex-shrink-0">
            <PDFPropertiesPanel
              selectedObject={selectedObject}
              onUpdateProperty={handleUpdateProperty}
              onDelete={handleDeleteSelected}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <KeyboardShortcutsDialog
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      <ExportOptionsDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
    </PDFErrorBoundary>
  );
};
