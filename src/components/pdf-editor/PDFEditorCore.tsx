import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Download, Undo, Redo, Type, Square, Image as ImageIcon, Eraser, Users, FileText } from 'lucide-react';
import { PDFOperation, PDFEditingSession } from '@/types/pdf-editor';
import { OperationQueue } from '@/lib/pdf/operationQueue';
import { usePDFRealtime } from '@/hooks/usePDFRealtime';
import { LiveCursors } from './LiveCursors';
import { TextEditDialog } from './TextEditDialog';
import { FormFieldEditor } from './FormFieldEditor';
import { extractTextFromPDF, findTextAtPosition, TextItem } from '@/lib/pdf/textExtractor';
import { extractFormFields, FormField } from '@/lib/pdf/formExtractor';
import { uploadImageToStorage, compressImage } from '@/lib/pdf/imageUploader';
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
  const [userId, setUserId] = useState<string | null>(null);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedText, setSelectedText] = useState<TextItem | null>(null);
  const [showTextEditDialog, setShowTextEditDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const operationQueueRef = useRef<OperationQueue | null>(null);
  const { toast } = useToast();

  // Initialize user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Real-time collaboration hook
  const { collaborators, remoteOperations, updateCursor, isConnected } = usePDFRealtime(
    session?.id || null,
    userId
  );

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

  const onDocumentLoadSuccess = async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    
    // Extract text and form fields from PDF
    if (pdfFile) {
      try {
        const [extractedText, extractedFields] = await Promise.all([
          extractTextFromPDF(pdfFile),
          extractFormFields(pdfFile)
        ]);
        setTextItems(extractedText);
        setFormFields(extractedFields);
        console.log(`Extracted ${extractedText.length} text items and ${extractedFields.length} form fields`);
      } catch (error) {
        console.error('Error extracting PDF content:', error);
      }
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!session || !userId) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on existing text (for editing)
    const clickedText = findTextAtPosition(textItems, x, y, currentPage - 1);
    if (clickedText && editMode === 'text') {
      setSelectedText(clickedText);
      setShowTextEditDialog(true);
      return;
    }

    // Continue with normal operation if in edit mode
    if (!editMode) return;

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
      userId,
    };

    operationQueueRef.current?.addOperation(operation);
    drawOperationOnCanvas(operation);

    toast({
      title: 'Operation added',
      description: `${editMode} operation queued (auto-saving in 2s)`,
    });
  };

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !session || !userId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    updateCursor(x, y, currentPage);
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

  // Apply remote operations from collaborators
  useEffect(() => {
    if (remoteOperations.length === 0) return;

    console.log('Processing remote operations:', remoteOperations.length);
    remoteOperations.forEach((op) => {
      operationQueueRef.current?.applyRemoteOperation(op);
      drawOperationOnCanvas(op);
    });
  }, [remoteOperations]);

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

  // Text editing handlers
  const handleTextEdit = (newText: string, fontSize: number, color: { r: number; g: number; b: number }) => {
    if (!selectedText || !userId) return;

    const operation: PDFOperation = {
      id: `op_${Date.now()}_${Math.random()}`,
      type: 'edit_text',
      page: selectedText.page,
      x: selectedText.x,
      y: selectedText.y,
      data: {
        text: newText,
        fontSize,
        color,
        oldText: selectedText.text,
        width: selectedText.width,
        height: selectedText.height,
      },
      timestamp: Date.now(),
      userId,
    };

    operationQueueRef.current?.addOperation(operation);
    
    toast({
      title: 'Text edited',
      description: 'Text changes will be saved automatically',
    });
  };

  // Drag & drop handlers for images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!session || !userId || !containerRef.current) return;

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please drop an image file (PNG, JPG)',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      // Upload to storage
      const imageUrl = await uploadImageToStorage(compressedFile);

      // Get drop position
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create add_image operation
      const operation: PDFOperation = {
        id: `op_${Date.now()}_${Math.random()}`,
        type: 'add_image',
        page: currentPage - 1,
        x,
        y,
        data: { imageUrl, width: 200, height: 200 },
        timestamp: Date.now(),
        userId,
      };

      operationQueueRef.current?.addOperation(operation);
      
      toast({
        title: 'Image added',
        description: 'Image will be embedded in PDF',
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload image',
        variant: 'destructive',
      });
    }
  };

  // Form field change handler
  const handleFormFieldChange = (fieldName: string, value: string) => {
    if (!userId || !session) return;

    const field = formFields.find(f => f.name === fieldName);
    if (!field) return;

    const operation: PDFOperation = {
      id: `op_${Date.now()}_${Math.random()}`,
      type: 'fill_form',
      page: field.page,
      x: field.x,
      y: field.y,
      data: { fieldName, fieldValue: value },
      timestamp: Date.now(),
      userId,
    };

    operationQueueRef.current?.addOperation(operation);
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

          {isConnected && collaborators.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
              </span>
            </div>
          )}

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

              <Button
                variant={editMode === 'image' ? 'default' : 'outline'}
                onClick={() => setEditMode(editMode === 'image' ? null : 'image')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>

              {formFields.length > 0 && (
                <Button variant="outline" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  {formFields.length} Fields
                </Button>
              )}

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
          <div
            ref={containerRef}
            className={`relative ${isDragging ? 'ring-4 ring-primary ring-opacity-50' : ''}`}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
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
            <FormFieldEditor 
              fields={formFields.filter(f => f.page === currentPage - 1)} 
              onFieldChange={handleFormFieldChange}
            />
            <LiveCursors cursors={collaborators} containerRef={containerRef} />
            {isDragging && (
              <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
                <div className="text-2xl font-bold text-primary">Drop image here</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Upload a PDF to start editing
          </div>
        )}
      </div>

      {/* Text Edit Dialog */}
      <TextEditDialog
        open={showTextEditDialog}
        onClose={() => {
          setShowTextEditDialog(false);
          setSelectedText(null);
        }}
        textItem={selectedText}
        onSave={handleTextEdit}
      />

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
