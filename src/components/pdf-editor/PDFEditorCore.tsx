import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Upload, Download, Undo, Redo, Type, Square, Image as ImageIcon, Eraser, Users, FileText, ZoomIn, ZoomOut, Search, Keyboard, MoreVertical, Loader2, Check, AlertCircle, PenTool, Share2 } from 'lucide-react';
import { PDFOperation, PDFEditingSession } from '@/types/pdf-editor';
import { OperationQueue } from '@/lib/pdf/operationQueue';
import { usePDFRealtime } from '@/hooks/usePDFRealtime';
import { LiveCursors } from './LiveCursors';
import { TextFormatToolbar } from './TextFormatToolbar';
import { FormFieldEditor } from './FormFieldEditor';
import { PDFSearchDialog, SearchResult } from './PDFSearchDialog';
import { ShortcutsDialog } from '@/components/lightpaper/ShortcutsDialog';
import { extractTextFromPDF, findTextAtPosition, TextItem } from '@/lib/pdf/textExtractor';
import { extractFormFields, FormField } from '@/lib/pdf/formExtractor';
import { uploadImageToStorage, compressImage } from '@/lib/pdf/imageUploader';
import { cn } from '@/lib/utils';
import { SignaturePanel } from './SignaturePanel';
import { PDFShareDialog } from './PDFShareDialog';
import { PDFEditorQuickReference } from '@/components/PDFEditorQuickReference';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFEditorCoreProps {
  sessionId?: string;
  onSessionCreated?: (session: PDFEditingSession) => void;
}

export const PDFEditorCore = ({ sessionId, onSessionCreated }: PDFEditorCoreProps) => {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfFileForShare, setPdfFileForShare] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [session, setSession] = useState<PDFEditingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'text' | 'rectangle' | 'delete' | 'image' | 'signature' | null>(null);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([1]));
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [userId, setUserId] = useState<string | null>(null);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedText, setSelectedText] = useState<TextItem | null>(null);
  const [textToolbarPosition, setTextToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [fitMode, setFitMode] = useState<'width' | 'page' | null>('width');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [hoveredText, setHoveredText] = useState<TextItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const operationQueueRef = useRef<OperationQueue | null>(null);
  const pendingDrawOps = useRef<PDFOperation[]>([]);
  const drawFrameId = useRef<number | null>(null);
  const { toast } = useToast();

  // Initialize user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'z',
      ctrl: true,
      handler: () => handleUndo(),
      description: 'Undo last operation'
    },
    {
      key: 'y',
      ctrl: true,
      handler: () => handleRedo(),
      description: 'Redo operation'
    },
    {
      key: 's',
      ctrl: true,
      handler: (e) => {
        e.preventDefault();
        const pendingOps = operationQueueRef.current?.getPendingOperations();
        if (pendingOps && pendingOps.length > 0) {
          applyOperations(operationQueueRef.current?.getOperations() || []);
        } else {
          toast({ title: 'Already saved', description: 'No pending changes' });
        }
      },
      description: 'Save changes'
    },
    {
      key: 'f',
      ctrl: true,
      handler: (e) => {
        e.preventDefault();
        setShowSearchDialog(true);
      },
      description: 'Search in PDF'
    },
    {
      key: '/',
      ctrl: true,
      handler: () => setShowShortcutsDialog(true),
      description: 'Show keyboard shortcuts'
    },
    {
      key: '+',
      ctrl: true,
      handler: (e) => {
        e.preventDefault();
        setScale(prev => Math.min(prev + 0.1, 3.0));
      },
      description: 'Zoom in'
    },
    {
      key: '-',
      ctrl: true,
      handler: (e) => {
        e.preventDefault();
        setScale(prev => Math.max(prev - 0.1, 0.3));
      },
      description: 'Zoom out'
    },
    {
      key: 't',
      handler: () => setEditMode('text'),
      description: 'Text tool'
    },
    {
      key: 'r',
      handler: () => setEditMode('rectangle'),
      description: 'Rectangle tool'
    },
    {
      key: 'e',
      handler: () => setEditMode('delete'),
      description: 'Eraser tool'
    },
    {
      key: 's',
      handler: () => {
        setEditMode('signature');
        setShowSignaturePanel(true);
      },
      description: 'Signature tool'
    },
    {
      key: 'Escape',
      handler: () => setEditMode(null),
      description: 'Deselect tool'
    },
    {
      key: 'ArrowRight',
      handler: () => setCurrentPage(prev => Math.min(numPages, prev + 1)),
      description: 'Next page'
    },
    {
      key: 'ArrowLeft',
      handler: () => setCurrentPage(prev => Math.max(1, prev - 1)),
      description: 'Previous page'
    }
  ], !!session);

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

  // Cleanup: stop auto-save on unmount
  useEffect(() => {
    return () => {
      operationQueueRef.current?.stopAutoSave();
      console.log('🛑 Stopped auto-save on unmount');
    };
  }, []);

  const loadSession = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_editing_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setSession(data);
      
      // Generate fresh signed URL for the PDF (24 hours expiry)
      const storedValue = data.current_version_url || data.pdf_url;
      let pdfPath = storedValue;
      
      // Handle legacy URLs - extract path if it's a full URL
      if (storedValue.includes('/pdf-documents/')) {
        pdfPath = storedValue.split('/pdf-documents/')[1];
      }
      
      const { data: signedData, error: signedError } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(pdfPath, 86400); // 24 hours
      
      if (signedError) throw signedError;
      setPdfFile(signedData.signedUrl);
      
      // Initialize operation queue for loaded sessions
      if (!operationQueueRef.current) {
        operationQueueRef.current = new OperationQueue(async (operations) => {
          await applyOperations(operations);
        });
        operationQueueRef.current.startAutoSave(2000);
        console.log('✅ Operation queue initialized for loaded session');
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

      // Create signed URL (24 hours expiry)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(fileName, 86400); // 24 hours

      if (signedError) throw signedError;
      const signedUrl = signedData.signedUrl;

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('pdf_editing_sessions')
        .insert({
          user_id: user.id,
          pdf_url: fileName, // Store path, not URL
          title: file.name,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSession(sessionData);
      setPdfFile(signedUrl);
      setPdfFileForShare(signedUrl); // Store signed URL for sharing
      
      // Initialize operation queue with auto-save
      operationQueueRef.current = new OperationQueue(async (operations) => {
        await applyOperations(operations);
      });
      operationQueueRef.current.startAutoSave(2000);
      console.log('✅ Operation queue initialized for new upload');

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
    setPdfError(null);
    
    // Calculate optimal scale to fit width
    if (containerRef.current && fitMode === 'width') {
      const containerWidth = containerRef.current.offsetWidth;
      // PDF default width is approximately 612 points (8.5 inches at 72 DPI)
      const optimalScale = (containerWidth * 0.95) / 612;
      setScale(Math.min(Math.max(optimalScale, 0.3), 3.0));
    }
    
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

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfError(error.message);
    toast({
      title: 'PDF Load Error',
      description: 'This PDF may be corrupted or password-protected',
      variant: 'destructive',
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!session || !userId) return;

    const container = event.currentTarget;
    
    // Get the actual PDF page element to find its position
    const pageElement = container.querySelector('.react-pdf__Page');
    if (!pageElement) return;
    
    const pageRect = pageElement.getBoundingClientRect();
    
    // Calculate position relative to PDF page
    const relativeX = event.clientX - pageRect.left;
    const relativeY = event.clientY - pageRect.top;
    
    // Convert to PDF coordinates (accounting for scale)
    const pdfX = relativeX / scale;
    const pdfY = relativeY / scale;

    // Handle signature placement
    if (editMode === 'signature' && currentSignature) {
      const operation: PDFOperation = {
        id: `op_${Date.now()}_${Math.random()}`,
        type: 'add_image',
        page: currentPage - 1,
        x: pdfX,
        y: pdfY,
        data: { imageUrl: currentSignature, width: 150, height: 60 },
        timestamp: Date.now(),
        userId,
      };

      operationQueueRef.current?.addOperation(operation);
      drawOperationOnCanvas(operation);
      
      toast({
        title: 'Signature placed',
        description: 'Signature added (auto-saving in 2s)',
      });

      setEditMode(null);
      setCurrentSignature(null);
      return;
    }

    // Check if clicking on existing text (for editing) - works regardless of edit mode
    const clickedText = findTextAtPosition(textItems, pdfX, pdfY, currentPage - 1);
    if (clickedText) {
      setSelectedText(clickedText);
      // Position toolbar above the text
      setTextToolbarPosition({ x: event.clientX, y: event.clientY - 60 });
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
      x: pdfX,
      y: pdfY,
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

  // Handle mouse movement for text hover
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const container = event.currentTarget;
    const pageElement = container.querySelector('.react-pdf__Page');
    if (!pageElement) return;
    
    const pageRect = pageElement.getBoundingClientRect();
    const relativeX = event.clientX - pageRect.left;
    const relativeY = event.clientY - pageRect.top;
    const pdfX = relativeX / scale;
    const pdfY = relativeY / scale;
    
    const textUnderCursor = findTextAtPosition(textItems, pdfX, pdfY, currentPage - 1);
    setHoveredText(textUnderCursor);
  };

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !session || !userId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    updateCursor(x, y, currentPage);
    
    // Also update hover state for text cursor
    handleCanvasMouseMove(event);
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
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Apply scale transformation
    ctx.save();
    ctx.scale(scale, scale);

    switch (operation.type) {
      case 'edit_text': {
        const { text, fontSize, color, width, height } = operation.data || {};
        
        // Cover old text with white rectangle
        if (width && height) {
          ctx.fillStyle = 'white';
          ctx.fillRect(operation.x, operation.y - height, width, height);
        }
        
        // Draw new text
        if (text && fontSize && color) {
          ctx.font = `${fontSize}px Helvetica`;
          ctx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
          ctx.fillText(text, operation.x, operation.y);
        }
        break;
      }
      
      case 'add_text': {
        const { text, fontSize, color } = operation.data || {};
        if (text && fontSize && color) {
          ctx.font = `${fontSize}px Helvetica`;
          ctx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
          ctx.fillText(text, operation.x, operation.y);
        }
        break;
      }
      
      case 'add_rectangle': {
        const { width, height, color, borderColor, borderWidth } = operation.data || {};
        if (borderColor && borderWidth) {
          ctx.strokeStyle = `rgb(${borderColor.r * 255}, ${borderColor.g * 255}, ${borderColor.b * 255})`;
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(operation.x, operation.y, width || 100, height || 50);
        }
        if (color) {
          ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.3)`;
          ctx.fillRect(operation.x, operation.y, width || 100, height || 50);
        }
        break;
      }
      
      case 'add_image': {
        // Show placeholder for images
        ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
        const { width, height } = operation.data || {};
        ctx.fillRect(operation.x, operation.y, width || 100, height || 100);
        ctx.strokeStyle = 'rgba(0, 100, 200, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(operation.x, operation.y, width || 100, height || 100);
        break;
      }
      
      case 'delete_content': {
        const { width, height } = operation.data || {};
        ctx.fillStyle = 'white';
        ctx.fillRect(operation.x, operation.y, width || 100, height || 50);
        break;
      }
    }
    
    ctx.restore();
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

  const applyOperations = async (operations: PDFOperation[], retryCount = 0) => {
    if (!session) return;

    setSaveStatus('saving');
    try {
      console.log('🔄 Applying', operations.length, 'operations to PDF for session:', session.id);
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('pdf-manipulation', {
        body: {
          sessionId: session.id,
          operations,
          pdfUrl: session.current_version_url || session.pdf_url,
        },
      });

      console.log('📡 Edge function response:', response);

      if (response.error) {
        console.error('❌ Edge function error:', {
          error: response.error,
          message: response.error.message,
          context: response.error.context
        });
        throw response.error;
      }

      // Mark operations as saved to backend
      operations.forEach(op => {
        op.savedToBackend = true;
      });

      // Reload the PDF with signed URL from response
      setPdfFile(response.data.signedUrl);
      
      console.log('✅ PDF operations applied successfully:', response.data);
      toast({
        title: 'Success',
        description: `Saved ${operations.length} changes to PDF`,
      });
      setSaveStatus('saved');
      
      // Update pending count
      setPendingOperationsCount(operationQueueRef.current?.getPendingOperations().length || 0);
      
      // Clear "saved" status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('❌ Apply operations error:', error);
      setSaveStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to save changes to PDF',
        variant: 'destructive',
      });
      
      if (retryCount < 3) {
        // Retry with exponential backoff
        setTimeout(() => setSaveStatus('idle'), 3000);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return applyOperations(operations, retryCount + 1);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to apply operations',
        variant: 'destructive',
        action: (
          <Button size="sm" onClick={() => applyOperations(operations)}>
            Retry
          </Button>
        ),
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

  // Search result handler
  const handleSearchResult = (result: SearchResult) => {
    setCurrentPage(result.page + 1);
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    setTouchStart({ 
      x: touch.clientX - rect.left, 
      y: touch.clientY - rect.top 
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart && editMode && userId && session) {
      const operation: PDFOperation = {
        id: `op_${Date.now()}_${Math.random()}`,
        type: editMode === 'text' ? 'add_text' : 
              editMode === 'rectangle' ? 'add_rectangle' : 
              editMode === 'delete' ? 'delete_content' : 'add_image',
        page: currentPage - 1,
        x: touchStart.x,
        y: touchStart.y,
        data: getOperationData(editMode),
        timestamp: Date.now(),
        userId,
      };
      operationQueueRef.current?.addOperation(operation);
    }
    setTouchStart(null);
  };

  // Update canvas dimensions on scale change
  useEffect(() => {
    if (!canvasRef.current || !numPages || !containerRef.current) return;
    
    const updateCanvasSize = () => {
      const pageElement = containerRef.current?.querySelector('.react-pdf__Page canvas');
      if (pageElement && canvasRef.current) {
        const pageCanvas = pageElement as HTMLCanvasElement;
        canvasRef.current.width = pageCanvas.width;
        canvasRef.current.height = pageCanvas.height;
        
        // Redraw all operations with new scale
        const operations = operationQueueRef.current?.getOperations() || [];
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          operations.forEach(op => {
            if (op.page === currentPage - 1) {
              drawOperationOnCanvas(op);
            }
          });
        }
      }
    };
    
    // Small delay to ensure PDF page is rendered
    const timeoutId = setTimeout(updateCanvasSize, 100);
    return () => clearTimeout(timeoutId);
  }, [scale, numPages, currentPage]);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
            setLoadedPages((prev) => new Set([...prev, pageNum]));
          }
        });
      },
      {
        rootMargin: '200px',
      }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [numPages]);

  const handleSignatureSelect = (signatureData: string, type: 'draw' | 'text') => {
    setCurrentSignature(signatureData);
    setEditMode('signature');
    toast({
      title: 'Signature selected',
      description: 'Click on the PDF to place your signature',
    });
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        {/* Toolbar */}
        <Card className="p-2 sm:p-4 mb-4">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <>
              <Input
                ref={fileInputRef}
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Upload PDF</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload PDF file</TooltipContent>
              </Tooltip>
            </>

            {isConnected && collaborators.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                      {collaborators.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{collaborators.length} active collaborator{collaborators.length !== 1 ? 's' : ''}</TooltipContent>
              </Tooltip>
            )}

            {session && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={editMode === 'text' ? 'default' : 'outline'}
                      onClick={() => setEditMode(editMode === 'text' ? null : 'text')}
                    >
                      <Type className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Text</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Text tool (T)</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={editMode === 'rectangle' ? 'default' : 'outline'}
                      onClick={() => setEditMode(editMode === 'rectangle' ? null : 'rectangle')}
                    >
                      <Square className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Shape</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rectangle tool (R)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={editMode === 'delete' ? 'default' : 'outline'}
                      onClick={() => setEditMode(editMode === 'delete' ? null : 'delete')}
                    >
                      <Eraser className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Erase</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eraser tool (E)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={editMode === 'image' ? 'default' : 'outline'}
                      onClick={() => setEditMode(editMode === 'image' ? null : 'image')}
                    >
                      <ImageIcon className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Image</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Drag & drop images</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={editMode === 'signature' ? 'default' : 'outline'}
                      onClick={() => {
                        setEditMode(editMode === 'signature' ? null : 'signature');
                        setShowSignaturePanel(true);
                      }}
                    >
                      <PenTool className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Sign</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add signature (S)</TooltipContent>
                </Tooltip>

                {formFields.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" disabled>
                        <FileText className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{formFields.length} Fields</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{formFields.length} form fields detected</TooltipContent>
                  </Tooltip>
                )}

                <div className="hidden md:flex flex-1" />

                {/* Desktop buttons */}
                <div className="hidden md:flex items-center gap-1">
                  {/* Zoom controls */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setScale(s => Math.max(0.3, s - 0.1))}>
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom out (Ctrl + -)</TooltipContent>
                  </Tooltip>
                  <span className="text-xs sm:text-sm font-medium min-w-[50px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button size="sm" variant="outline" onClick={() => setScale(s => Math.min(3.0, s + 0.1))}>
                         <ZoomIn className="w-4 h-4" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Zoom in (Ctrl + +)</TooltipContent>
                   </Tooltip>

                   {/* Fit buttons */}
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button 
                         size="sm" 
                         variant={fitMode === 'width' ? 'default' : 'outline'}
                         onClick={() => {
                           if (containerRef.current) {
                             const containerWidth = containerRef.current.offsetWidth;
                             const optimalScale = (containerWidth * 0.95) / 612;
                             setScale(Math.min(Math.max(optimalScale, 0.3), 3.0));
                             setFitMode('width');
                           }
                         }}
                       >
                         Fit Width
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Fit to width</TooltipContent>
                   </Tooltip>

                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button 
                         size="sm" 
                         variant={fitMode === 'page' ? 'default' : 'outline'}
                         onClick={() => {
                           if (containerRef.current) {
                             const containerHeight = containerRef.current.offsetHeight;
                             // PDF default height is approximately 792 points (11 inches at 72 DPI)
                             const optimalScale = (containerHeight * 0.90) / 792;
                             setScale(Math.min(Math.max(optimalScale, 0.3), 3.0));
                             setFitMode('page');
                           }
                         }}
                       >
                         Fit Page
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Fit to page</TooltipContent>
                   </Tooltip>

                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button 
                         size="sm" 
                         variant={fitMode === null ? 'default' : 'outline'}
                         onClick={() => {
                           setScale(1.0);
                           setFitMode(null);
                         }}
                       >
                         100%
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>Reset to 100%</TooltipContent>
                   </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setShowSearchDialog(true)}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Search (Ctrl + F)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setShowShortcutsDialog(true)}>
                        <Keyboard className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Keyboard shortcuts (Ctrl + /)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUndo}
                        disabled={!operationQueueRef.current?.canUndo()}
                      >
                        <Undo className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Undo</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Ctrl + Z)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRedo}
                        disabled={!operationQueueRef.current?.canRedo()}
                      >
                        <Redo className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Redo</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo (Ctrl + Y)</TooltipContent>
                  </Tooltip>

                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Saving {pendingOperationsCount} changes...</span>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="hidden sm:inline text-sm text-green-600">All changes saved</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>All changes saved to PDF</TooltipContent>
                    </Tooltip>
                  )}
                  {saveStatus === 'error' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="hidden sm:inline text-sm text-destructive">Save failed - retrying...</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Save failed - retrying...</TooltipContent>
                    </Tooltip>
                  )}
                  {saveStatus === 'idle' && pendingOperationsCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="hidden sm:inline text-sm text-yellow-600">{pendingOperationsCount} unsaved changes</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{pendingOperationsCount} unsaved changes</TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setShowShareDialog(true)}>
                        <Share2 className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share PDF</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download PDF</TooltipContent>
                  </Tooltip>
                </div>

                {/* Mobile dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="md:hidden">
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowSearchDialog(true)}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowShortcutsDialog(true)}>
                      <Keyboard className="w-4 h-4 mr-2" />
                      Shortcuts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUndo} disabled={!operationQueueRef.current?.canUndo()}>
                      <Undo className="w-4 h-4 mr-2" />
                      Undo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRedo} disabled={!operationQueueRef.current?.canRedo()}>
                      <Redo className="w-4 h-4 mr-2" />
                      Redo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </Card>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex flex-col gap-4 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-[600px] w-full" />
            </div>
          )}

          {!loading && pdfFile && (
            <div
              ref={containerRef}
              className={cn(
                "relative",
                isDragging && "ring-4 ring-primary ring-opacity-50",
                hoveredText && "cursor-text"
              )}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className="flex justify-center"
                loading={<Skeleton className="h-[600px] w-full max-w-3xl mx-auto" />}
                error={
                  <div className="text-center p-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Failed to Load PDF</h3>
                    <p className="text-sm text-muted-foreground">{pdfError || 'Unknown error'}</p>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
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
                scale={scale}
              />
              <LiveCursors cursors={collaborators} containerRef={containerRef} />
              {isDragging && (
                <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="text-lg sm:text-2xl font-bold text-primary">Drop image here</div>
                </div>
              )}
            </div>
          )}
          
          {!loading && !pdfFile && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Upload a PDF to start editing
            </div>
          )}
        </div>

        {/* Search Dialog */}
        <PDFSearchDialog
          open={showSearchDialog}
          onClose={() => setShowSearchDialog(false)}
          textItems={textItems}
          onResultSelect={handleSearchResult}
        />

        {/* Shortcuts Dialog */}
        <ShortcutsDialog
          open={showShortcutsDialog}
          onOpenChange={setShowShortcutsDialog}
          type="pdf"
        />

        {/* Text Format Toolbar */}
        {selectedText && textToolbarPosition && (
          <TextFormatToolbar
            position={textToolbarPosition}
            text={selectedText.text}
            fontSize={selectedText.height}
            color={{ r: 0, g: 0, b: 0 }}
            onSave={(newText, fontSize, color) => {
              handleTextEdit(newText, fontSize, color);
              setTextToolbarPosition(null);
              setSelectedText(null);
            }}
            onClose={() => {
              setTextToolbarPosition(null);
              setSelectedText(null);
            }}
          />
        )}

        {/* Signature Panel */}
        <SignaturePanel
          open={showSignaturePanel}
          onOpenChange={setShowSignaturePanel}
          onSignatureSelect={handleSignatureSelect}
        />

        {/* Share Dialog */}
        {session && pdfFileForShare && (
          <PDFShareDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            sessionId={session.id}
            sessionTitle={session.title}
            pdfUrl={pdfFileForShare}
          />
        )}

        {/* Page Navigation */}
        {numPages > 0 && (
          <Card className="p-2 sm:p-4 mt-4">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page (←)</TooltipContent>
              </Tooltip>
              <span className="text-xs sm:text-sm font-medium">
                Page {currentPage} of {numPages}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                    disabled={currentPage >= numPages}
                  >
                    Next
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page (→)</TooltipContent>
              </Tooltip>
            </div>
          </Card>
        )}
      </div>

      <PDFEditorQuickReference />
    </TooltipProvider>
  );
};
