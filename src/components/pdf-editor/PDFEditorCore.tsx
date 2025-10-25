import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Download, Undo, Redo, Type, Square, Image, Eraser } from 'lucide-react';
import { PDFOperation, PDFEditingSession } from '@/types/pdf-editor';
import { OperationQueue } from '@/lib/pdf/operationQueue';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFEditorCoreProps {
  sessionId?: string;
  onSessionCreated?: (session: PDFEditingSession) => void;
}

export const PDFEditorCore = ({ sessionId, onSessionCreated }: PDFEditorCoreProps) => {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [session, setSession] = useState<PDFEditingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<'text' | 'rectangle' | 'delete' | 'image' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const operationQueueRef = useRef<OperationQueue | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_editing_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setSession(data);
      setPdfFile(data.current_version_url || data.pdf_url);
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

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload PDF to storage
      const fileName = `pdf-sessions/${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(fileName);

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('pdf_editing_sessions')
        .insert({
          user_id: user.id,
          pdf_url: publicUrl,
          title: file.name,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSession(sessionData);
      setPdfFile(publicUrl);
      
      // Initialize operation queue with auto-save
      operationQueueRef.current = new OperationQueue(async (operations) => {
        await applyOperations(operations);
      });
      operationQueueRef.current.startAutoSave(2000);

      onSessionCreated?.(sessionData);

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
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !session) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const operation: PDFOperation = {
      id: `op_${Date.now()}_${Math.random()}`,
      type: editMode === 'text' ? 'add_text' : 
            editMode === 'rectangle' ? 'add_rectangle' : 
            editMode === 'delete' ? 'delete_content' : 'add_image',
      page: currentPage - 1,
      x,
      y,
      data: getOperationData(editMode),
      timestamp: Date.now(),
    };

    operationQueueRef.current?.addOperation(operation);
    drawOperationOnCanvas(operation);

    toast({
      title: 'Operation added',
      description: `${editMode} operation queued (auto-saving in 2s)`,
    });
  };

  const getOperationData = (mode: string) => {
    switch (mode) {
      case 'text':
        return { text: 'Sample Text', fontSize: 14, color: { r: 0, g: 0, b: 0 } };
      case 'rectangle':
        return { width: 100, height: 50, color: { r: 0, g: 0, b: 1 }, borderWidth: 2 };
      case 'delete':
        return { width: 100, height: 50 };
      default:
        return {};
    }
  };

  const drawOperationOnCanvas = (operation: PDFOperation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
    ctx.fillRect(operation.x, operation.y, 100, 50);
  };

  const applyOperations = async (operations: PDFOperation[]) => {
    if (!session) return;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('pdf-manipulation', {
        body: {
          sessionId: session.id,
          operations,
          pdfUrl: session.current_version_url || session.pdf_url,
        },
      });

      if (response.error) throw response.error;

      // Reload the PDF with new version
      setPdfFile(response.data.pdfUrl);
      
      toast({
        title: 'Success',
        description: response.data.message,
      });
    } catch (error) {
      console.error('Apply operations error:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply operations',
        variant: 'destructive',
      });
    }
  };

  const handleUndo = () => {
    if (operationQueueRef.current?.undo()) {
      toast({ title: 'Undo', description: 'Last operation undone' });
    }
  };

  const handleRedo = () => {
    if (operationQueueRef.current?.redo()) {
      toast({ title: 'Redo', description: 'Operation redone' });
    }
  };

  const handleDownload = () => {
    if (pdfFile) {
      window.open(pdfFile, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor="pdf-upload">
            <Button asChild disabled={loading}>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </span>
            </Button>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {session && (
            <>
              <Button
                variant={editMode === 'text' ? 'default' : 'outline'}
                onClick={() => setEditMode(editMode === 'text' ? null : 'text')}
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>
              
              <Button
                variant={editMode === 'rectangle' ? 'default' : 'outline'}
                onClick={() => setEditMode(editMode === 'rectangle' ? null : 'rectangle')}
              >
                <Square className="w-4 h-4 mr-2" />
                Shape
              </Button>

              <Button
                variant={editMode === 'delete' ? 'default' : 'outline'}
                onClick={() => setEditMode(editMode === 'delete' ? null : 'delete')}
              >
                <Eraser className="w-4 h-4 mr-2" />
                Erase
              </Button>

              <div className="flex-1" />

              <Button
                variant="outline"
                onClick={handleUndo}
                disabled={!operationQueueRef.current?.canUndo()}
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </Button>

              <Button
                variant="outline"
                onClick={handleRedo}
                disabled={!operationQueueRef.current?.canRedo()}
              >
                <Redo className="w-4 h-4 mr-2" />
                Redo
              </Button>

              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto">
        {pdfFile ? (
          <div className="relative" onClick={handleCanvasClick}>
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex justify-center"
            >
              <Page
                pageNumber={currentPage}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Upload a PDF to start editing
          </div>
        )}
      </div>

      {/* Page Navigation */}
      {numPages > 0 && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
              disabled={currentPage >= numPages}
            >
              Next
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
