import { useState, useRef, useCallback } from 'react';
import { PDFBackgroundLayer } from './PDFBackgroundLayer';
import { PDFFabricCanvas } from './PDFFabricCanvas';
import { PDFToolbar } from './PDFToolbar';
import { FabricCanvasManager } from '@/lib/pdf/FabricCanvasManager';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const PDFEditorContainer = () => {
  const { pdfUrl, setPdfUrl, setTotalPages, currentPage, reset } = usePDFEditorStore();
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const fabricManagerRef = useRef<FabricCanvasManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

  const handleExport = useCallback(() => {
    if (!fabricManagerRef.current) {
      toast.error('No canvas to export');
      return;
    }

    // TODO: Implement export in Phase 3
    toast.info('Export functionality coming in Phase 3');
  }, []);

  return (
    <div className="flex flex-col h-full bg-muted/30">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <PDFToolbar onUpload={handleUpload} onExport={handleExport} />

      <div className="flex-1 overflow-auto p-8">
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
    </div>
  );
};
