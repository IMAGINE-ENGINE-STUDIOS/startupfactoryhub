import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Save, Strikethrough, Calculator, Image, Palette, Moon, Sun, Highlighter, PenLine, Download, FileText, Search, Keyboard, MessageSquare, Users, WifiOff, Wifi, Upload, ZoomIn, ZoomOut, Maximize2, Eye, Edit3, Plus, Pipette, FlipHorizontal, FileType, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { addLightPaperMessage } from "./MessageCenter";

// Replace toast with message center - same API surface
const toast = {
  success: (msg: string) => addLightPaperMessage("success", msg),
  error: (msg: string) => addLightPaperMessage("error", msg),
  info: (msg: string) => addLightPaperMessage("info", msg),
  warning: (msg: string) => addLightPaperMessage("warning", msg),
  loading: (msg: string) => addLightPaperMessage("info", msg),
  dismiss: (_?: any) => {},
};
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import { SearchDialog } from "./SearchDialog";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandHistory, Command } from "@/lib/commandHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDocumentCollaboration } from "@/hooks/useDocumentCollaboration";
import { LiveCursors } from "./LiveCursors";
import { CommentsSidebar } from "./CommentsSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { sanitizeHTML } from "@/utils/sanitize";
import { MobileToolbar } from "./MobileToolbar";
import { FileUploadDialog } from "./FileUploadDialog";
import { parseDocumentAsImages, parseDocumentForEditing } from "./AdvancedDocumentParser";
import { OverlayTextBox } from "./OverlayTextBox";
import { AIToolbar } from "./AIToolbar";
import { PageManagementPanel } from "./PageManagementPanel";
import { TextReader } from "./TextReader";
import GeniusAIBubble from "./GeniusAIBubble";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto", "Open Sans", "Lato", "Montserrat"];
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36"];
const HIGHLIGHT_COLORS = ["#FFFF00", "#00FF00", "#00FFFF", "#FF00FF", "#FFA500", "transparent"];
const TEXT_COLORS = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFFFFF"];

// Page format configurations (dimensions in cm) - All MS Word & Google Docs formats
const PAGE_FORMATS = {
  // US Standard Formats (Microsoft Word)
  letter: { width: 21.59, height: 27.94, name: 'Letter (8.5" × 11")' },
  legal: { width: 21.59, height: 35.56, name: 'Legal (8.5" × 14")' },
  tabloid: { width: 27.94, height: 43.18, name: 'Tabloid (11" × 17")' },
  ledger: { width: 43.18, height: 27.94, name: 'Ledger (17" × 11")' },
  statement: { width: 13.97, height: 21.59, name: 'Statement (5.5" × 8.5")' },
  executive: { width: 18.415, height: 26.67, name: 'Executive (7.25" × 10.5")' },
  folio: { width: 21.0, height: 33.0, name: 'Folio (8.27" × 13")' },
  quarto: { width: 21.59, height: 27.5, name: 'Quarto (8.5" × 10.83")' },
  // ISO A Series
  a3: { width: 29.7, height: 42.0, name: "A3 (297 × 420 mm)" },
  a4: { width: 21.0, height: 29.7, name: "A4 (210 × 297 mm)" },
  a5: { width: 14.8, height: 21.0, name: "A5 (148 × 210 mm)" },
  a6: { width: 10.5, height: 14.8, name: "A6 (105 × 148 mm)" },
  // ISO B Series
  b4: { width: 25.0, height: 35.3, name: "B4 (250 × 353 mm)" },
  b5: { width: 17.6, height: 25.0, name: "B5 (176 × 250 mm)" },
  // JIS B Series (Japan - Google Docs)
  jisb4: { width: 25.7, height: 36.4, name: "JIS B4 (257 × 364 mm)" },
  jisb5: { width: 18.2, height: 25.7, name: "JIS B5 (182 × 257 mm)" },
  // Google Docs specific
  "10x15": { width: 25.4, height: 38.1, name: '10" × 15"' },
  "8x13": { width: 20.32, height: 33.02, name: '8" × 13"' },
};

const MARGIN_CM = 2.54; // 1 inch standard margin
const CM_TO_PX = 37.795275591; // Conversion factor for cm to pixels at 96dpi

type PageFormat = keyof typeof PAGE_FORMATS;
type Orientation = "portrait" | "landscape";

interface OverlayTextBoxData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderVisible: boolean;
}

interface LightPaperDocumentProps {
  selectedProject?: LightPaperProject | null;
  uploadedContent?: { content: string; title: string; metadata?: { detectedFormat?: string; fileType?: string; uploadMode?: 'edit' | 'view' } } | null;
  onContentLoaded?: () => void;
}

export function LightPaperDocument({
  selectedProject,
  uploadedContent,
  onContentLoaded
}: LightPaperDocumentProps = {}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState("14");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState(() => {
    const now = new Date();
    return `Document - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
  const [selectedHighlight, setSelectedHighlight] = useState("#FFFF00");
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState("#000000");
  
  // Get today's date for default content
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const [documentContent, setDocumentContent] = useState(`
    <h1 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5em; color: inherit;">Document Title</h1>
    <p style="font-size: 14pt; margin-bottom: 1.5em; color: inherit; opacity: 0.7;">${dateStr}</p>
    <p style="font-size: 14pt; color: inherit;">Start writing your document...</p>
  `);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatures, setSignatures] = useState<Array<{type: "draw" | "text", data: string, id: string}>>(() => {
    try {
      const saved = localStorage.getItem('lightpaper-signatures');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [signatureMode, setSignatureMode] = useState<"draw" | "text">("draw");
  const [textSignature, setTextSignature] = useState("");
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const lastSignPosRef = useRef({ x: 0, y: 0 });
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingSignature, setDraggingSignature] = useState<{type: "draw" | "text", data: string, id: string} | null>(null);
  const [signaturePreviewPosition, setSignaturePreviewPosition] = useState<{x: number, y: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveProjectRef = useRef<NodeJS.Timeout>();
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showTextReader, setShowTextReader] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // kept for compat but effectiveTotalPages is used for navigation
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const commandHistory = useRef(new CommandHistory());
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  // Page format and view mode states
  const [pageFormat, setPageFormat] = useState<PageFormat>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [viewMode, setViewMode] = useState(false);
  const [viewModeImages, setViewModeImages] = useState<string[]>([]);
  const [visiblePage, setVisiblePage] = useState(1); // Track currently visible page in scrollable view
  const [overlayTextBoxes, setOverlayTextBoxes] = useState<OverlayTextBoxData[]>([]);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [placingTextBox, setPlacingTextBox] = useState(false); // Text box anchored to cursor mode
  const [isEditingText, setIsEditingText] = useState(false);
  const [pages, setPages] = useState<string[]>(['']);
  const [showPagePanel, setShowPagePanel] = useState(false);

  const [editTextLayers, setEditTextLayers] = useState<any[][]>([]); // Per-page text layer items for hybrid editing
  const [editTextViewportSize, setEditTextViewportSize] = useState<{ width: number; height: number } | null>(null);
  const [uploadSource, setUploadSource] = useState<'edit' | 'view' | null>(null); // Tracks user intent from FileUploadDialog
  const [uploadedFileType, setUploadedFileType] = useState<'pdf' | 'docx' | null>(null); // Track file type for mode switching
  const [originalFile, setOriginalFile] = useState<File | null>(null); // Store original file for re-parsing (DOCX view→edit)
  const [docxEditablePages, setDocxEditablePages] = useState<string[]>([]); // Per-page editable HTML for DOCX Edit Mode
  const [docxEditableStyles, setDocxEditableStyles] = useState<string>(''); // Collected styles from docx-preview

  // Derive totalPages from pages array to avoid sync issues
  const effectiveTotalPages = docxEditablePages.length > 0 ? docxEditablePages.length : (viewMode && viewModeImages.length > 0 ? viewModeImages.length : Math.max(pages.length, 1));

  // Scale PDF reconstructed content to fit within the editor container
  const scalePdfContentToFit = useCallback((container: HTMLDivElement | null) => {
    if (!container) return;
    const innerContent = container.querySelector('.pdf-inner-content') as HTMLElement;
    if (!innerContent) return;
    
    const pageContentEl = container.closest('.page-content') as HTMLElement;
    if (!pageContentEl) return;
    
    const availableWidth = pageContentEl.clientWidth;
    const availableHeight = pageContentEl.clientHeight;
    
    const vpWidth = parseFloat(innerContent.getAttribute('data-viewport-width') || '0');
    const vpHeight = parseFloat(innerContent.getAttribute('data-viewport-height') || '0');
    
    if (vpWidth <= 0 || vpHeight <= 0) return;
    
    const scaleX = availableWidth / vpWidth;
    const scaleY = availableHeight / vpHeight;
    const scale = Math.min(scaleX, scaleY, 1.0);
    
    innerContent.style.transform = `scale(${scale})`;
    innerContent.style.transformOrigin = 'top left';
  }, []);
  const [geniusBubblePos, setGeniusBubblePos] = useState<{ x: number; y: number } | null>(null);
  const {
    saveProject
  } = useLightPaperProjects("document");

  // Real-time collaboration
  const {
    cursors,
    comments,
    myColor,
    addComment,
    updateComment,
    deleteComment,
    updateCursor,
  } = useDocumentCollaboration({
    projectId: currentProjectId,
    enabled: !!currentProjectId,
  });

  // Throttled cursor position tracking
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !currentProjectId) return;

    let lastUpdate = 0;
    const THROTTLE_MS = 100; // Update max 10 times per second

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < THROTTLE_MS) return;

      const rect = editor.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      updateCursor(x, y);
      lastUpdate = now;
    };

    editor.addEventListener('mousemove', handleMouseMove);
    return () => editor.removeEventListener('mousemove', handleMouseMove);
  }, [currentProjectId, updateCursor]);

  // Remove hard-coded dark mode styles - use theme-aware classes instead
  // This effect now does nothing intentionally - theme is handled by CSS
  useEffect(() => {
    // Removed hard-coded backgroundColor and color styles
    // Theme is now properly handled by CSS variables
  }, []);

  // Initialize signature canvas with transparent background
  useEffect(() => {
    const canvas = signCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas with transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [showSignDialog]);

  // Initialize signature canvas when dialog opens
  useEffect(() => {
    if (showSignDialog && signCanvasRef.current) {
      const canvas = signCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Set drawing properties
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [showSignDialog]);

  // Initialize pages with default content if empty
  useEffect(() => {
    if (pages.length === 0 || (pages.length === 1 && pages[0] === '')) {
      const initialContent = documentContent || `<p style="font-size: 14pt; color: inherit;">Start writing...</p>`;
      setPages([initialContent]);
      setTotalPages(1);
    }
  }, []);

  // Load uploaded content - ENHANCED for View Mode
  useEffect(() => {
    if (!uploadedContent) return;
    const loadContent = async () => {
    
    console.log('Loading uploaded content', uploadedContent.content.substring(0, 100));
    
    try {
      // TRY TO PARSE AS JSON (View Mode or Hybrid Mode)
      const parsed = JSON.parse(uploadedContent.content);
      
      if (parsed.mode === 'docx-editable' && parsed.editablePages && Array.isArray(parsed.editablePages)) {
        console.log(`✓ DOCX Editable Mode: ${parsed.editablePages.length} pages`);
        
        // Set editable pages state
        setDocxEditablePages(parsed.editablePages);
        setDocxEditableStyles(parsed.styles || '');
        setViewMode(false);
        setViewModeImages([]);
        setEditMode(true);
        setEditTextLayers([]);
        setTotalPages(parsed.editablePages.length);
        setCurrentPage(1);
        setVisiblePage(1);
        setUploadSource(uploadedContent.metadata?.uploadMode || 'edit');
        setUploadedFileType((uploadedContent.metadata?.fileType as 'pdf' | 'docx') || null);
        
        // Set format if detected
        const detFormat = parsed.metadata?.detectedFormat || uploadedContent.metadata?.detectedFormat;
        if (detFormat && detFormat in PAGE_FORMATS) {
          setPageFormat(detFormat as PageFormat);
        }
        
        if (editorRef.current) editorRef.current.innerHTML = '';
        setDocumentContent('');
        
        toast.success(`DOCX loaded: ${parsed.editablePages.length} editable pages`);
        setProjectTitle(uploadedContent.title);
        setCurrentProjectId(null);
        onContentLoaded?.();
        return;
      }
      
      if ((parsed.mode === 'view' || parsed.mode === 'hybrid') && parsed.images && Array.isArray(parsed.images)) {
        console.log(`✓ ${parsed.mode === 'hybrid' ? 'Hybrid' : 'View'} Mode: ${parsed.images.length} pages with images`);
        
        // Validate that images array contains valid base64 data
        const validImages = parsed.images.filter((img: string) => {
          return typeof img === 'string' && 
                 (img.startsWith('data:image/jpeg;base64,') || 
                  img.startsWith('data:image/png;base64,'));
        });
        
        if (validImages.length === 0) {
          console.error('✗ No valid images found in data');
          toast.error('No valid images found in document');
          throw new Error('No valid images found');
        }
        
        console.log(`✓ Validated ${validImages.length} images`);
        
        // Set state
        setViewMode(true);
        setViewModeImages(validImages);
        setDocxEditablePages([]); // Clear editable pages
        setTotalPages(validImages.length);
        setCurrentPage(1);
        setVisiblePage(1);
        
        // Track upload source and file type from metadata
        setUploadSource(uploadedContent.metadata?.uploadMode || (parsed.mode === 'hybrid' ? 'edit' : 'view'));
        setUploadedFileType((uploadedContent.metadata?.fileType as 'pdf' | 'docx') || null);
        
        // Handle hybrid mode text layers
        if (parsed.mode === 'hybrid' && parsed.textLayers && Array.isArray(parsed.textLayers)) {
          setEditTextLayers(parsed.textLayers);
          setEditMode(true); // Auto-enable edit mode for hybrid
          // Store viewport dimensions for percentage-based positioning
          if (parsed.metadata?.dimensions) {
            setEditTextViewportSize(parsed.metadata.dimensions);
          } else {
            // Fallback: use standard page dimensions if metadata missing
            const pageDims = getPageDimensions();
            setEditTextViewportSize({ width: pageDims.width * CM_TO_PX, height: pageDims.height * CM_TO_PX });
            console.log('⚠ Using fallback viewport size from page dimensions');
          }
          console.log(`✓ Loaded text layers for ${parsed.textLayers.length} pages`);
        } else {
          setEditTextLayers([]);
          setEditTextViewportSize(null);
        }
        
        // Set format if detected (from JSON metadata or upload metadata)
        const detFormat = parsed.metadata?.detectedFormat || parsed.detectedFormat || uploadedContent.metadata?.detectedFormat;
        if (detFormat && detFormat in PAGE_FORMATS) {
          setPageFormat(detFormat as PageFormat);
          toast.info(`Format: ${PAGE_FORMATS[detFormat as PageFormat]?.name || detFormat.toUpperCase()}`);
        }
        
        // Clear editor to prevent JSON from showing
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        setDocumentContent('');
        
        const modeLabel = parsed.mode === 'hybrid' ? 'Edit Mode (hybrid)' : 'View Mode';
        toast.success(`${modeLabel}: ${validImages.length} pages loaded`);
        setProjectTitle(uploadedContent.title);
        setCurrentProjectId(null);
        onContentLoaded?.();
        return; // EXIT - don't run Edit Mode logic
      }
    } catch (e) {
      // NOT JSON: Regular HTML content (Edit Mode)
      console.log('Edit Mode: Loading HTML content');
    }
    
    // EDIT MODE LOGIC (only runs if JSON parse failed or not view mode)
    // For reconstructed PDF/DOCX pages, switch to View Mode for pixel-perfect display
    // This avoids the fragile html2canvas-on-cloned-HTML approach
    const htmlContent = uploadedContent.content;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const reconstructedPages = doc.querySelectorAll('.pdf-page-reconstructed, .docx-page-wrapper');
    
    if (reconstructedPages.length > 0) {
      // Render each reconstructed page to a canvas image using html2canvas in a hidden container
      const pageImages: string[] = [];
      
      const hiddenContainer = document.createElement('div');
      hiddenContainer.style.position = 'absolute';
      hiddenContainer.style.left = '-9999px';
      hiddenContainer.style.top = '0';
      document.body.appendChild(hiddenContainer);
      
      for (let i = 0; i < reconstructedPages.length; i++) {
        const pageEl = reconstructedPages[i] as HTMLElement;
        const clone = pageEl.cloneNode(true) as HTMLElement;
        
        const innerContent = clone.querySelector('.pdf-inner-content') as HTMLElement;
        let renderWidth = 816;
        let renderHeight = 1056;
        
        if (innerContent) {
          const vpW = parseFloat(innerContent.getAttribute('data-viewport-width') || '0');
          const vpH = parseFloat(innerContent.getAttribute('data-viewport-height') || '0');
          if (vpW > 0 && vpH > 0) {
            renderWidth = vpW;
            renderHeight = vpH;
            innerContent.style.transform = 'none';
          }
        }
        
        clone.style.width = `${renderWidth}px`;
        clone.style.height = `${renderHeight}px`;
        clone.style.overflow = 'hidden';
        clone.style.background = 'white';
        clone.style.position = 'relative';
        
        hiddenContainer.innerHTML = '';
        hiddenContainer.appendChild(clone);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        try {
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: renderWidth,
            height: renderHeight,
            logging: false
          });
          pageImages.push(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error(`Failed to render page ${i + 1}:`, err);
        }
      }
      
      document.body.removeChild(hiddenContainer);
      
      if (pageImages.length > 0) {
        // Detect format from first reconstructed page
        const firstInner = reconstructedPages[0]?.querySelector('.pdf-inner-content');
        if (firstInner) {
          const vpW = parseFloat(firstInner.getAttribute('data-viewport-width') || '0');
          const vpH = parseFloat(firstInner.getAttribute('data-viewport-height') || '0');
          if (vpW > 0 && vpH > 0) {
            const pdfWidthPt = vpW / 1.5;
            const pdfHeightPt = vpH / 1.5;
            const pdfWidthMm = (pdfWidthPt / 72) * 25.4;
            const pdfHeightMm = (pdfHeightPt / 72) * 25.4;
            const tolerance = 10;
            const formats: Record<string, { w: number; h: number }> = {
              letter: { w: 215.9, h: 279.4 }, legal: { w: 215.9, h: 355.6 },
              a4: { w: 210, h: 297 }, a3: { w: 297, h: 420 },
              a5: { w: 148, h: 210 }, tabloid: { w: 279.4, h: 431.8 },
            };
            for (const [name, dims] of Object.entries(formats)) {
              if ((Math.abs(pdfWidthMm - dims.w) < tolerance && Math.abs(pdfHeightMm - dims.h) < tolerance) ||
                  (Math.abs(pdfWidthMm - dims.h) < tolerance && Math.abs(pdfHeightMm - dims.w) < tolerance)) {
                setPageFormat(name in PAGE_FORMATS ? name as PageFormat : 'letter');
                setOrientation(pdfWidthMm > pdfHeightMm ? 'landscape' : 'portrait');
                break;
              }
            }
          }
        }
        
        setViewMode(true);
        setViewModeImages(pageImages);
        setTotalPages(pageImages.length);
        setCurrentPage(1);
        setVisiblePage(1);
        
        if (editorRef.current) editorRef.current.innerHTML = '';
        setDocumentContent('');
        
        toast.success(`Document loaded: ${pageImages.length} pages (layout preserved)`);
        setProjectTitle(uploadedContent.title);
        setCurrentProjectId(null);
        onContentLoaded?.();
        return;
      }
    }
    
    // Fallback: plain HTML content (non-PDF, typed content, etc.)
    setViewMode(false);
    setViewModeImages([]);
    setEditMode(true); // Auto-select edit mode for uploaded files
    setUploadSource(uploadedContent.metadata?.uploadMode || 'edit');
    setUploadedFileType((uploadedContent.metadata?.fileType as 'pdf' | 'docx') || null);
    
    // Apply detected format from upload metadata
    const detFormat = uploadedContent.metadata?.detectedFormat;
    if (detFormat && detFormat in PAGE_FORMATS) {
      setPageFormat(detFormat as PageFormat);
      console.log(`[LightPaper] Applied detected format: ${detFormat}`);
    }
    
    // Wrap DOCX content to fill the page width properly
    const fileType = uploadedContent.metadata?.fileType;
    let finalHtml = htmlContent;
    if (fileType === 'docx' || fileType === 'pdf') {
      // Ensure content fills the page by wrapping with proper styling
      finalHtml = `<div style="width: 100%; min-height: 100%; font-size: 12pt; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word;">${htmlContent}</div>`;
    }
    
    setDocumentContent(finalHtml);
    setTotalPages(1);
    setCurrentPage(1);
    
    if (editorRef.current) {
      editorRef.current.innerHTML = finalHtml;
      editorRef.current.contentEditable = 'true';
      editorRef.current.style.cursor = 'text';
      
      // Trigger overflow pagination after DOM settles
      // Dispatch synthetic input events to trigger the existing overflow handler
      const triggerPagination = (iteration: number) => {
        if (iteration > 200) return;
        requestAnimationFrame(() => {
          setTimeout(() => {
            const editor = editorRef.current;
            if (!editor) return;
            const pageContentEl = editor.parentElement;
            if (pageContentEl && editor.scrollHeight > pageContentEl.clientHeight + 2) {
              editor.dispatchEvent(new Event('input', { bubbles: true }));
              triggerPagination(iteration + 1);
            } else if (iteration === 200) {
              // Safety check: warn if content still seems too large for one page
              if (editor.scrollHeight > pageContentEl!.clientHeight * 1.5) {
                console.warn('[LightPaper] HTML pagination may have failed — content still overflows after max iterations');
              }
            }
          }, 100);
        });
      };
      // Initial delay to let the DOM render
      requestAnimationFrame(() => triggerPagination(0));
    }
    
    toast.success(`Document loaded`);
    setProjectTitle(uploadedContent.title);
    setCurrentProjectId(null);
    onContentLoaded?.();
    };
    loadContent();
  }, [uploadedContent, onContentLoaded]);

  // Auto-save uploaded files that don't have a project ID yet
  useEffect(() => {
    if (currentProjectId || !user || !projectTitle) return;
    // Only auto-save if there's actual content (view mode images or editor content)
    const hasContent = (viewMode && viewModeImages.length > 0) || 
                       (editorRef.current && editorRef.current.innerHTML && editorRef.current.innerHTML !== '<p style="font-size: 14pt; color: inherit;">Start writing...</p>');
    if (!hasContent) return;

    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        const content = buildSaveContent();
        const result = await saveProject(projectTitle, "document", content);
        if (result) {
          setCurrentProjectId(result.id);
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error('Auto-save new project failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [viewMode, viewModeImages.length, projectTitle, currentProjectId, user]);

  useEffect(() => {
    const pageCount = viewMode && viewModeImages.length > 0 ? viewModeImages.length : docxEditablePages.length;
    if (pageCount === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.id.replace('page-', ''));
            if (!isNaN(pageNum)) {
              setVisiblePage(pageNum);
              setCurrentPage(pageNum); // Keep currentPage in sync for navigation
            }
          }
        });
      },
      {
        threshold: 0.5, // Page is considered visible when 50% is in view
        rootMargin: '0px'
      }
    );
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      for (let i = 0; i < pageCount; i++) {
        const pageEl = document.getElementById(`page-${i + 1}`);
        if (pageEl) observer.observe(pageEl);
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [viewMode, viewModeImages, docxEditablePages]);

  // Sync documentContent to editor when it changes (but not during user input)
  const isUserTyping = useRef(false);
  useEffect(() => {
    if (editorRef.current && documentContent && !isUserTyping.current) {
      // Parse content to extract the current page
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentContent, 'text/html');
      const pages = doc.querySelectorAll('.pdf-page-reconstructed, .docx-page-wrapper');
      
      if (pages.length > 0) {
        // Display only the current page
        const currentPageElement = pages[currentPage - 1];
        if (currentPageElement) {
          editorRef.current.innerHTML = currentPageElement.outerHTML;
          // Apply CSS scaling for PDF pages
          requestAnimationFrame(() => {
            scalePdfContentToFit(editorRef.current);
          });
        }
      } else {
        // No structured pages, display all content
        editorRef.current.innerHTML = documentContent;
      }
    }
  }, [documentContent, currentPage, scalePdfContentToFit]);

  // Load project and versions when selectedProject changes
  useEffect(() => {
    if (!selectedProject || selectedProject.project_type !== "document") return;
    const loadProjectWithVersions = async () => {
      setCurrentProjectId(selectedProject.id);
      setProjectTitle(selectedProject.title);
      const content = selectedProject.content as any;
      
      if (content) {
        // Restore view mode images if saved
        if (content.viewMode && content.viewModeImages && content.viewModeImages.length > 0) {
          setViewMode(true);
          setViewModeImages(content.viewModeImages);
          setTotalPages(content.viewModeImages.length);
          setCurrentPage(content.currentPage || 1);
          setVisiblePage(content.currentPage || 1);
          if (content.editTextLayers) setEditTextLayers(content.editTextLayers);
          if (content.editTextViewportSize) setEditTextViewportSize(content.editTextViewportSize);
          if (content.overlayTextBoxes) setOverlayTextBoxes(content.overlayTextBoxes);
          if (content.pageFormat) setPageFormat(content.pageFormat);
          if (content.orientation) setOrientation(content.orientation);
          if (content.uploadedFileType) setUploadedFileType(content.uploadedFileType);
          if (editorRef.current) editorRef.current.innerHTML = '';
          setDocumentContent('');
          toast.success("Document restored");
        } else {
          // Reset view mode when loading a non-view saved project
          setViewMode(false);
          setViewModeImages([]);

          if (content.html) {
            setDocumentContent(content.html);
            
            if (editorRef.current) {
              editorRef.current.innerHTML = content.html;
            }
            
            if (content.font) setSelectedFont(content.font);
            if (content.size) setSelectedSize(content.size);
            if (content.totalPages) setTotalPages(content.totalPages);
            if (content.currentPage) setCurrentPage(content.currentPage);
            if (content.darkMode !== undefined) {
              setIsDarkMode(content.darkMode);
              const pageElement = document.querySelector('.page') as HTMLElement;
              if (pageElement) {
                pageElement.style.backgroundColor = content.darkMode ? 'black' : 'white';
                pageElement.style.color = content.darkMode ? 'white' : 'black';
              }
              if (editorRef.current) {
                editorRef.current.style.color = content.darkMode ? 'white' : 'black';
              }
            }
            if (content.pageFormat) setPageFormat(content.pageFormat);
            if (content.orientation) setOrientation(content.orientation);
            if (content.overlayTextBoxes) setOverlayTextBoxes(content.overlayTextBoxes);

            if (content.pages && Array.isArray(content.pages)) {
              setPages(content.pages);
            } else {
              setPages([content.html]);
            }

            toast.success("Document loaded successfully");
          }
        }
      }

      // Load version history for this session
      await loadVersionHistory();
      
      // Clean up old versions on load
      if (user?.id) {
        const { cleanupOldVersions } = await import('@/utils/versionCleanup');
        const result = await cleanupOldVersions(user.id);
        if (result.success && result.deletedCount > 0) {
          console.log(`Cleaned up ${result.deletedCount} old versions`);
        }
      }
    };
    
    loadProjectWithVersions();
  }, [selectedProject?.id]);

  // Cleanup temporary versions on logout or unmount
  useEffect(() => {
    const cleanupOnLogout = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase.from('document_versions').delete().eq('user_id', user.id).eq('session_id', sessionId).eq('is_temporary', true);
        }
      } catch (error) {
        console.error('Error cleaning up versions:', error);
      }
    };

    // Listen for auth state changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        cleanupOnLogout();
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      cleanupOnLogout();
    };
  }, [sessionId]);

  // Load version history from database
  const loadVersionHistory = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('document_versions').select('*').eq('user_id', user.id).eq('session_id', sessionId).eq('is_temporary', true).order('version_number', {
        ascending: true
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setVersions(data);
        setCurrentVersionIndex(data.length - 1);
      }
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  };

  // Save version to database
  const saveVersionToDatabase = async (html: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const versionNumber = versions.length;
      const {
        data,
        error
      } = await supabase.from('document_versions').insert({
        user_id: user.id,
        project_id: currentProjectId,
        session_id: sessionId,
        content: {
          html,
          font: selectedFont,
          size: selectedSize,
          darkMode: isDarkMode
        },
        version_number: versionNumber,
        is_temporary: true
      }).select().single();
      if (error) throw error;
      if (data) {
        setVersions([...versions, data]);
        setCurrentVersionIndex(versions.length);
      }
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  // Save current page content to pages array
  const saveCurrentPageContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[currentPage - 1] = content;
        return newPages;
      });
    }
  };

  // Handle page selection with content save/load
  const handlePageSelect = (newPage: number) => {
    // Clamp to valid range
    const maxPage = viewMode ? viewModeImages.length : pages.length;
    const targetPage = Math.max(1, Math.min(newPage, maxPage));
    if (targetPage === currentPage && !viewMode) return;
    
    // Save current page content first (edit mode only)
    if (!viewMode) {
      saveCurrentPageContent();
    }
    
    // Switch to new page
    setCurrentPage(targetPage);
    setVisiblePage(targetPage);
    
    // In view mode, scroll to the target page
    if (viewMode && viewModeImages.length > 0) {
      setTimeout(() => {
        const pageEl = document.getElementById(`page-${targetPage}`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }
    
    // Load new page content into editor
    if (editorRef.current && pages[targetPage - 1] !== undefined) {
      editorRef.current.innerHTML = pages[targetPage - 1];
      setDocumentContent(pages[targetPage - 1]);
    }
  };

  // Auto-save version with debounce
  const autoSaveVersion = (html: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveVersionToDatabase(html);
    }, 2000); // Save after 2 seconds of inactivity
  };

  // Auto-save project to database (overwrites existing file)
  const autoSaveProject = useCallback(() => {
    if (!currentProjectId || !user) return;
    if (autoSaveProjectRef.current) {
      clearTimeout(autoSaveProjectRef.current);
    }
    autoSaveProjectRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const content = buildSaveContent();
        await saveProject(projectTitle, "document", content, currentProjectId);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 3000); // Auto-save after 3s of inactivity
  }, [currentProjectId, user, documentContent, pages, selectedFont, selectedSize, isDarkMode, currentPage, pageFormat, orientation, viewMode, viewModeImages, editTextLayers, overlayTextBoxes, projectTitle, saveProject]);

  // Auto-page creation: detect when content overflows the page
  const checkAndHandleOverflow = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || viewMode) return;

    // Calculate max content height from page format (in px)
    // Use the page-content element's clientHeight for accuracy (accounts for zoom)
    const pageContentEl = editor.parentElement;
    const maxContentHeightPx = pageContentEl
      ? pageContentEl.clientHeight - 2 // small buffer
      : ((getPageDimensions().height - (MARGIN_CM * 2)) * CM_TO_PX);

    // Check if editor content exceeds allowable area
    if (editor.scrollHeight <= maxContentHeightPx + 2) return;

    // Find the split point: accumulate child offsets
    const children = Array.from(editor.childNodes);
    if (children.length === 0) return;

    let splitIndex = -1;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      // Use offsetTop + offsetHeight relative to editor for zoom-independent measurement
      if (child.offsetTop !== undefined && child.offsetHeight !== undefined) {
        const childBottom = child.offsetTop + child.offsetHeight;
        if (childBottom > maxContentHeightPx) {
          splitIndex = i;
          break;
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        // Wrap loose text nodes in a span to measure
        const wrapper = document.createElement('span');
        editor.replaceChild(wrapper, child);
        wrapper.appendChild(child);
        const bottom = wrapper.offsetTop + wrapper.offsetHeight;
        // Unwrap
        editor.replaceChild(child, wrapper);
        if (bottom > maxContentHeightPx) {
          splitIndex = i;
          break;
        }
      }
    }

    // If splitIndex is 0, the very first element overflows — still need to split
    // (put it on a new page if it's not the only content)
    if (splitIndex === -1) return;

    // Ensure we move at least one element to the next page
    const effectiveSplitIndex = Math.max(splitIndex, 1);
    // But if there's only one child and it overflows, we can't split further
    if (children.length === 1 && splitIndex === 0) return;

    const overflowNodes = children.slice(effectiveSplitIndex);
    const overflowHtml = overflowNodes.map(n => {
      if (n instanceof HTMLElement) return n.outerHTML;
      if (n.nodeType === Node.TEXT_NODE) return `<p>${n.textContent || ''}</p>`;
      return '';
    }).join('');

    overflowNodes.forEach(n => editor.removeChild(n));

    const currentHtml = editor.innerHTML;
    
    // Use functional state updates to avoid stale closures
    setPages(prevPages => {
      const newPages = [...prevPages];
      newPages[currentPage - 1] = currentHtml;
      // Insert overflow as the next page (or prepend to existing next page)
      if (newPages[currentPage]) {
        newPages[currentPage] = overflowHtml + newPages[currentPage];
      } else {
        newPages.splice(currentPage, 0, overflowHtml);
      }
      return newPages;
    });
    // totalPages will be derived from pages.length via effectiveTotalPages

    toast.info(`Content moved to page ${currentPage + 1}`);
  }, [currentPage, viewMode, pageFormat, orientation]);

  // Handle content changes and auto-save
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handleInput = () => {
      isUserTyping.current = true;
      const html = editor.innerHTML;
      setDocumentContent(html);
      
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[currentPage - 1] = html;
        return newPages;
      });
      
      autoSaveVersion(html);
      autoSaveProject();

      // Check for overflow after DOM settles
      setTimeout(checkAndHandleOverflow, 300);

      setTimeout(() => {
        isUserTyping.current = false;
      }, 100);
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
      setTimeout(checkAndHandleOverflow, 500);
    };
    const handleMouseUp = () => {
      if (isHighlighterActive) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          applyHighlight(selectedHighlight);
        }
      }
    };
    editor.addEventListener('input', handleInput);
    editor.addEventListener('paste', handlePaste);
    editor.addEventListener('mouseup', handleMouseUp);
    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('paste', handlePaste);
      editor.removeEventListener('mouseup', handleMouseUp);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (autoSaveProjectRef.current) {
        clearTimeout(autoSaveProjectRef.current);
      }
    };
  }, [isHighlighterActive, selectedHighlight, checkAndHandleOverflow, autoSaveProject]);

  // Navigate version history from database
  const goToPreviousVersion = async () => {
    if (currentVersionIndex > 0 && editorRef.current && versions.length > 0) {
      const newIndex = currentVersionIndex - 1;
      const version = versions[newIndex];
      if (version && version.content) {
        editorRef.current.innerHTML = version.content.html;
        if (version.content.font) setSelectedFont(version.content.font);
        if (version.content.size) setSelectedSize(version.content.size);
        if (version.content.darkMode !== undefined) {
          setIsDarkMode(version.content.darkMode);
          const pageElement = document.querySelector('.page') as HTMLElement;
          if (pageElement) {
            pageElement.style.backgroundColor = version.content.darkMode ? 'black' : 'white';
            pageElement.style.color = version.content.darkMode ? 'white' : 'black';
          }
          if (editorRef.current) {
            editorRef.current.style.color = version.content.darkMode ? 'white' : 'black';
          }
        }
        setCurrentVersionIndex(newIndex);
        toast.success(`Restored version ${newIndex + 1}`);
      }
    } else {
      toast.info("No previous versions available");
    }
  };
  const goToNextVersion = async () => {
    if (currentVersionIndex < versions.length - 1 && editorRef.current) {
      const newIndex = currentVersionIndex + 1;
      const version = versions[newIndex];
      if (version && version.content) {
        editorRef.current.innerHTML = version.content.html;
        if (version.content.font) setSelectedFont(version.content.font);
        if (version.content.size) setSelectedSize(version.content.size);
        if (version.content.darkMode !== undefined) {
          setIsDarkMode(version.content.darkMode);
          const pageElement = document.querySelector('.page') as HTMLElement;
          if (pageElement) {
            pageElement.style.backgroundColor = version.content.darkMode ? 'black' : 'white';
            pageElement.style.color = version.content.darkMode ? 'white' : 'black';
          }
          if (editorRef.current) {
            editorRef.current.style.color = version.content.darkMode ? 'white' : 'black';
          }
        }
        setCurrentVersionIndex(newIndex);
        toast.success(`Restored version ${newIndex + 1}`);
      }
    } else {
      toast.info("No later versions available");
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'b', ctrl: true, handler: () => execCommand('bold'), description: 'Bold' },
    { key: 'i', ctrl: true, handler: () => execCommand('italic'), description: 'Italic' },
    { key: 'u', ctrl: true, handler: () => execCommand('underline'), description: 'Underline' },
    { key: 's', ctrl: true, handler: (e) => { e.preventDefault(); handleQuickSave(); }, description: 'Save' },
    { key: 'z', ctrl: true, handler: () => goToPreviousVersion(), description: 'Undo' },
    { key: 'y', ctrl: true, handler: () => goToNextVersion(), description: 'Redo' },
    { key: 'f', ctrl: true, handler: (e) => { e.preventDefault(); setShowSearchDialog(true); }, description: 'Find' },
    { key: '/', ctrl: true, handler: (e) => { e.preventDefault(); setShowShortcutsDialog(true); }, description: 'Shortcuts' },
  ], true);

  // Search functionality
  const handleSearch = (query: string, options: { caseSensitive: boolean; wholeWord: boolean }) => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.textContent || '';
    const searchContent = options.caseSensitive ? content : content.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    const matches: number[] = [];
    let index = 0;
    
    while (true) {
      index = searchContent.indexOf(searchQuery, index);
      if (index === -1) break;
      matches.push(index);
      index += searchQuery.length;
    }
    
    setSearchMatches(matches);
    setCurrentSearchIndex(0);
    
    if (matches.length > 0) {
      highlightSearchMatch(matches[0], query.length);
      toast.success(`Found ${matches.length} matches`);
    } else {
      toast.info("No matches found");
    }
  };

  const highlightSearchMatch = (index: number, length: number) => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.textContent || '';
    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + length);
    const afterMatch = text.substring(index + length);
    
    const highlightedHTML = `${beforeMatch}<mark style="background-color: yellow;">${match}</mark>${afterMatch}`;
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Scroll to the match
    editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchMatches.length;
    setCurrentSearchIndex(nextIndex);
    const query = editorRef.current?.textContent?.substring(searchMatches[nextIndex], searchMatches[nextIndex] + 10) || '';
    highlightSearchMatch(searchMatches[nextIndex], query.length);
  };

  const goToPreviousMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentSearchIndex(prevIndex);
    const query = editorRef.current?.textContent?.substring(searchMatches[prevIndex], searchMatches[prevIndex] + 10) || '';
    highlightSearchMatch(searchMatches[prevIndex], query.length);
  };

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();

      // Ensure the editor maintains focus and execute command
      setTimeout(() => {
        document.execCommand(command, false, value);
        
        // Show toast for list commands
        if (command === "insertUnorderedList") {
          toast.success("Bullet list created");
        } else if (command === "insertOrderedList") {
          toast.success("Numbered list created");
        }
      }, 0);
    }
  };
  const applyHeading = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      toast.error("Please select text first");
      return;
    }

    // Use formatBlock for proper heading formatting
    try {
      document.execCommand('formatBlock', false, `<${tag}>`);
      toast.success(`Applied ${tag.toUpperCase()}`);
    } catch (error) {
      console.error('Error applying heading:', error);
      toast.error("Failed to apply heading");
    }
  };
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const pageElement = document.querySelector('.page') as HTMLElement;
    
    if (newDarkMode) {
      // Dark mode: black background, white text
      if (pageElement) {
        pageElement.style.backgroundColor = 'black';
        pageElement.style.color = 'white';
        
        // Update list styles for dark mode
        const lists = pageElement.querySelectorAll('ul, ol, li');
        lists.forEach((list) => {
          (list as HTMLElement).style.color = 'white';
        });
      }
      if (editorRef.current) {
        editorRef.current.style.color = 'white';
      }
      toast.success("Dark mode enabled");
    } else {
      // Light mode: white background, black text
      if (pageElement) {
        pageElement.style.backgroundColor = 'white';
        pageElement.style.color = 'black';
        
        // Update list styles for light mode
        const lists = pageElement.querySelectorAll('ul, ol, li');
        lists.forEach((list) => {
          (list as HTMLElement).style.color = 'black';
        });
      }
      if (editorRef.current) {
        editorRef.current.style.color = 'black';
      }
      toast.success("Light mode enabled");
    }
  };

  const applyHighlight = (color: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      execCommand("hiliteColor", color);
      if (color === "transparent") {
        toast.success("Highlight removed");
        setIsHighlighterActive(false);
      } else {
        toast.success("Text highlighted");
      }
    }
  };

  const activateHighlighter = (color: string) => {
    setSelectedHighlight(color);
    if (color === "transparent") {
      setIsHighlighterActive(false);
      toast.info("Highlighter deactivated");
    } else {
      setIsHighlighterActive(true);
      toast.success("Highlighter active - select text to highlight");
    }
  };

  // Signature functions
  const startDrawingSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.Touch) => {
    if (signatureMode !== "draw") return;
    if ('preventDefault' in e) e.preventDefault();
    setIsDrawingSignature(true);
    const canvas = signCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      lastSignPosRef.current = { x, y };
    }
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.Touch) => {
    if (!isDrawingSignature || signatureMode !== "draw") return;
    if ('preventDefault' in e) e.preventDefault();
    
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.beginPath();
      ctx.moveTo(lastSignPosRef.current.x, lastSignPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastSignPosRef.current = { x, y };
    }
  };

  const stopDrawingSignature = () => {
    if (isDrawingSignature && signCanvasRef.current) {
      // Save as PNG with transparent background
      const signatureData = signCanvasRef.current.toDataURL('image/png');
      setSignatures([
        ...signatures,
        {
          type: "draw",
          data: signatureData,
          id: Date.now().toString()
        }
      ]);
      clearSignCanvas();
      toast.success("Signature saved!");
    }
    setIsDrawingSignature(false);
  };

  const clearSignCanvas = () => {
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Reinitialize drawing properties
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      toast.success("Canvas cleared");
    }
  };

  const addTextSignature = () => {
    if (!textSignature.trim()) {
      toast.error("Please enter text for signature");
      return;
    }
    setSignatures([
      ...signatures,
      {
        type: "text",
        data: textSignature,
        id: Date.now().toString()
      }
    ]);
    setTextSignature("");
    toast.success("Signature added!");
  };

  const insertSignature = (signature: {type: "draw" | "text", data: string, id: string}) => {
    setDraggingSignature({ ...signature, id: Date.now().toString() });
    setShowSignDialog(false);
    toast.info("Click/tap on the document to place the signature. Press Escape to cancel.");
  };

  // Persist signatures to localStorage
  useEffect(() => {
    try { localStorage.setItem('lightpaper-signatures', JSON.stringify(signatures)); } catch {}
  }, [signatures]);

  // Handle signature placement — single placement then exit
  useEffect(() => {
    if (!draggingSignature || !containerRef.current) return;

    const container = containerRef.current;
    const pages = Array.from(container.querySelectorAll('.page')) as HTMLElement[];
    if (pages.length === 0) return;

    const getPageFromPoint = (clientX: number, clientY: number) => {
      for (const page of pages) {
        const rect = page.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom && clientX >= rect.left && clientX <= rect.right) {
          return page;
        }
      }
      // Find nearest page
      let closest = pages[0];
      let minDist = Infinity;
      for (const page of pages) {
        const rect = page.getBoundingClientRect();
        const cy = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - cy);
        if (dist < minDist) { minDist = dist; closest = page; }
      }
      return closest;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;
      const page = getPageFromPoint(clientX, clientY);
      const pageRect = page.getBoundingClientRect();
      // Calculate position relative to page, accounting for zoom
      const relX = clientX - pageRect.left;
      const relY = clientY - pageRect.top;
      setSignaturePreviewPosition({ x: relX, y: relY });
    };

    const createSignatureElement = (sig: typeof draggingSignature, parentPage: HTMLElement, x: number, y: number) => {
      if (!sig) return;
      const sigWidth = 120;
      const sigHeight = 40;
      const placedX = x - sigWidth / 2;
      const placedY = y - sigHeight / 2;

      const signatureElement = document.createElement('div');
      signatureElement.contentEditable = "false";
      signatureElement.id = `sig-placed-${Date.now()}`;
      signatureElement.style.cssText = `
        position: absolute;
        cursor: move;
        padding: 4px 8px;
        border: 2px dashed #3b82f6;
        background: rgba(255,255,255,0.95);
        left: ${Math.max(0, placedX)}px;
        top: ${Math.max(0, placedY)}px;
        z-index: 100;
        width: ${sigWidth}px;
        border-radius: 4px;
        user-select: none;
        touch-action: none;
      `;
      signatureElement.classList.add('signature-element');

      setTimeout(() => { signatureElement.style.border = '1px solid transparent'; }, 3000);
      signatureElement.addEventListener('mouseenter', () => { signatureElement.style.border = '2px dashed #3b82f6'; });
      signatureElement.addEventListener('mouseleave', () => { signatureElement.style.border = '1px solid transparent'; });

      let aspectRatio = 1;

      if (sig.type === "draw") {
        const img = document.createElement('img');
        img.src = sig.data;
        img.style.cssText = "width: 100%; height: auto; display: block; pointer-events: none;";
        img.onload = () => { aspectRatio = img.naturalWidth / img.naturalHeight; };
        signatureElement.appendChild(img);
      } else {
        signatureElement.style.fontFamily = "cursive";
        signatureElement.style.fontSize = "18px";
        signatureElement.style.lineHeight = "35px";
        signatureElement.textContent = sig.data;
        signatureElement.style.color = '#000000';
        signatureElement.style.whiteSpace = 'nowrap';
      }

      // Resize handle (bottom-right corner, aspect-ratio locked)
      const resizeHandle = document.createElement('div');
      resizeHandle.style.cssText = `
        position: absolute; bottom: -4px; right: -4px;
        width: 10px; height: 10px; background: #3b82f6;
        border-radius: 50%; cursor: se-resize; z-index: 110;
        border: 2px solid white; opacity: 0; transition: opacity 0.2s;
      `;
      signatureElement.addEventListener('mouseenter', () => { resizeHandle.style.opacity = '1'; });
      signatureElement.addEventListener('mouseleave', () => { resizeHandle.style.opacity = '0'; });
      signatureElement.appendChild(resizeHandle);

      // Resize logic — aspect-ratio locked
      let isResizing = false;
      let resizeStartX = 0, resizeStartWidth = 0;
      const startResize = (ev: MouseEvent | TouchEvent) => {
        ev.preventDefault(); ev.stopPropagation();
        isResizing = true;
        resizeStartX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        resizeStartWidth = signatureElement.offsetWidth;
      };
      const moveResize = (ev: MouseEvent | TouchEvent) => {
        if (!isResizing) return; ev.preventDefault();
        const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        const delta = cx - resizeStartX;
        const newWidth = Math.max(50, resizeStartWidth + delta);
        signatureElement.style.width = `${newWidth}px`;
        // height is auto via img width:100%, so aspect ratio is preserved
      };
      const endResize = () => { isResizing = false; };
      resizeHandle.addEventListener('mousedown', startResize);
      resizeHandle.addEventListener('touchstart', startResize, { passive: false });
      document.addEventListener('mousemove', moveResize);
      document.addEventListener('touchmove', moveResize, { passive: false });
      document.addEventListener('mouseup', endResize);
      document.addEventListener('touchend', endResize);

      // Drag with cross-page support
      let isDrag = false;
      let offX = 0, offY = 0;
      let currentParent = parentPage;

      const startDrag = (ev: MouseEvent | TouchEvent) => {
        if (isResizing) return;
        ev.preventDefault(); ev.stopPropagation();
        isDrag = true;
        const rect = signatureElement.getBoundingClientRect();
        const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
        offX = cx - rect.left; offY = cy - rect.top;
        signatureElement.style.cursor = 'grabbing';
      };
      const moveDrag = (ev: MouseEvent | TouchEvent) => {
        if (!isDrag || isResizing) return; ev.preventDefault();
        const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
        const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;

        // Find which page the cursor is over
        const targetPage = getPageFromPoint(cx, cy);
        if (targetPage && targetPage !== currentParent) {
          // Move to new page
          currentParent.removeChild(signatureElement);
          targetPage.appendChild(signatureElement);
          currentParent = targetPage;
        }

        const pRect = currentParent.getBoundingClientRect();
        let newX = cx - pRect.left - offX;
        let newY = cy - pRect.top - offY;
        // Allow full movement within page bounds
        const sW = signatureElement.offsetWidth;
        const sH = signatureElement.offsetHeight;
        newX = Math.max(0, Math.min(newX, pRect.width - sW));
        newY = Math.max(0, Math.min(newY, pRect.height - sH));
        signatureElement.style.left = `${newX}px`;
        signatureElement.style.top = `${newY}px`;
      };
      const endDrag = () => { isDrag = false; signatureElement.style.cursor = 'move'; };

      signatureElement.addEventListener('mousedown', startDrag);
      signatureElement.addEventListener('touchstart', startDrag, { passive: false });
      document.addEventListener('mousemove', moveDrag);
      document.addEventListener('touchmove', moveDrag, { passive: false });
      document.addEventListener('mouseup', endDrag);
      document.addEventListener('touchend', endDrag);

      // Double-click to remove
      signatureElement.addEventListener('dblclick', () => {
        currentParent.removeChild(signatureElement);
        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        document.removeEventListener('mousemove', moveResize);
        document.removeEventListener('touchmove', moveResize);
        document.removeEventListener('mouseup', endResize);
        document.removeEventListener('touchend', endResize);
        toast.success("Signature removed");
      });

      currentParent.appendChild(signatureElement);
      toast.success("Signature placed! Double-tap to remove.");
    };

    const placeSignature = (e: MouseEvent | TouchEvent) => {
      if (!draggingSignature) return;
      e.preventDefault();
      e.stopPropagation();

      const clientX = 'touches' in e ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.changedTouches[0]?.clientY ?? 0) : e.clientY;
      const targetPage = getPageFromPoint(clientX, clientY);
      const pageRect = targetPage.getBoundingClientRect();
      const x = clientX - pageRect.left;
      const y = clientY - pageRect.top;

      createSignatureElement(draggingSignature, targetPage, x, y);

      setDraggingSignature(null);
      setSignaturePreviewPosition(null);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraggingSignature(null);
        setSignaturePreviewPosition(null);
        toast.info("Signature placement cancelled");
      }
    };

    // Listen on container (all pages) instead of single page
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('touchmove', handlePointerMove as any, { passive: true });
    container.addEventListener('click', placeSignature as any);
    container.addEventListener('touchend', placeSignature as any);
    document.addEventListener('keydown', handleEscape);
    container.style.cursor = 'crosshair';

    return () => {
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('touchmove', handlePointerMove as any);
      container.removeEventListener('click', placeSignature as any);
      container.removeEventListener('touchend', placeSignature as any);
      document.removeEventListener('keydown', handleEscape);
      container.style.cursor = '';
    };
  }, [draggingSignature, isDarkMode]);

  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
    toast.success("Signature removed!");
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size must be less than 20MB");
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Please sign in to upload images");
        return;
      }
      toast.info("Uploading image...");
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('feed-media').upload(filePath, file);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }
      const {
        data
      } = supabase.storage.from('feed-media').getPublicUrl(filePath);

      // Insert image at cursor with strict container constraints
      const img = document.createElement('img');
      img.src = data.publicUrl;
      img.style.maxWidth = '100%';
      img.style.width = 'auto';
      img.style.height = 'auto';
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      img.style.margin = '10px 0';
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    }
  };
  const insertCalculatorResult = (value: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, value);
      setShowCalculator(false);
    }
  };
  // Build content object for saving
  const buildSaveContent = () => {
    // For docx editable mode, don't save the full HTML pages (too large for DB)
    // Instead save a lightweight reference
    const hasDocxEditable = docxEditablePages.length > 0;
    return {
      html: editorRef.current?.innerHTML || documentContent || "",
      pages,
      font: selectedFont,
      size: selectedSize,
      darkMode: isDarkMode,
      currentPage,
      totalPages: pages.length,
      pageFormat,
      orientation,
      viewMode,
      // Don't save large base64 images or docx HTML to avoid tsvector overflow
      viewModeImages: viewMode ? viewModeImages.slice(0, 3).map(img => 
        img.length > 500000 ? img.substring(0, 100) + '...[truncated]' : img
      ) : [],
      editTextLayers: editTextLayers.length > 0 ? editTextLayers : undefined,
      editTextViewportSize: editTextViewportSize || undefined,
      overlayTextBoxes,
      uploadedFileType: uploadedFileType || undefined,
      docxEditableMode: hasDocxEditable || undefined,
    };
  };

  // Quick save: overwrite existing or show dialog for new
  const handleQuickSave = async () => {
    if (currentProjectId) {
      try {
        setIsSaving(true);
        const content = buildSaveContent();
        await saveProject(projectTitle, "document", content, currentProjectId);
        setLastSaved(new Date());
        toast.success("Document saved");
      } catch (error) {
        toast.error("Failed to save document");
      } finally {
        setIsSaving(false);
      }
    } else {
      setShowSaveDialog(true);
    }
  };

  // Save (overwrite or create new)
  const handleSaveToAccount = async () => {
    if (!projectTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    try {
      setIsSaving(true);
      const content = buildSaveContent();
      const result = await saveProject(projectTitle, "document", content, currentProjectId || undefined);
      if (result) {
        setCurrentProjectId(result.id);
        setLastSaved(new Date());
        setShowSaveDialog(false);

        // Clean up temporary versions on save
        try {
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            await supabase.from('document_versions').delete().eq('user_id', user.id).eq('session_id', sessionId).eq('is_temporary', true);
            setVersions([]);
            setCurrentVersionIndex(-1);
          }
        } catch (error) {
          console.error('Error cleaning up versions:', error);
        }
        toast.success("Document saved");
      }
    } catch (error) {
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  // Save as new file (creates a copy)
  const handleSaveAsNew = async () => {
    if (!projectTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    try {
      setIsSaving(true);
      const copyTitle = `Copy - ${projectTitle}`;
      const content = buildSaveContent();
      // Pass undefined as projectId to force creating a new record
      const result = await saveProject(copyTitle, "document", content, undefined);
      if (result) {
        setCurrentProjectId(result.id);
        setProjectTitle(copyTitle);
        setLastSaved(new Date());
        setShowSaveDialog(false);
        toast.success(`Saved as "${copyTitle}"`);
      }
    } catch (error) {
      toast.error("Failed to save copy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadHTML = () => {
    try {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${projectTitle || 'Document'}</title>
  <style>
    body { 
      font-family: ${selectedFont}; 
      font-size: ${selectedSize}pt; 
      margin: 2.54cm;
      ${isDarkMode ? 'background-color: #1a1a1a; color: #ffffff;' : 'background-color: #ffffff; color: #000000;'}
    }
    .page { 
      page-break-after: always; 
      margin-bottom: 2cm;
    }
    .page:last-child { 
      page-break-after: auto; 
    }
  </style>
</head>
<body>${pages.map((page, idx) => `<div class="page" data-page="${idx + 1}">${page}</div>`).join('\n')}</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectTitle || 'Document'}.html`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("HTML file downloaded");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download HTML file");
    }
  };

  const handleDownloadDOCX = async () => {
    try {
      toast.loading("Preparing Word document...");
      
      // Create a simple text version of the document
      const textContent = pages.map((page, idx) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = page;
        return `Page ${idx + 1}\n\n${tempDiv.textContent || ''}\n\n`;
      }).join('\n---\n\n');
      
      // Create a blob with the text content
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectTitle || 'Document'}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Document downloaded as text file");
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error("Failed to download document");
    }
  };
  const handlePrint = async () => {
    try {
      toast.loading("Preparing document for print...");
      
      const pdf = new jsPDF(orientation === 'portrait' ? 'p' : 'l', 'mm', pageFormat);
      const pdfWidth = orientation === 'portrait' ? PAGE_FORMATS[pageFormat].width * 10 : PAGE_FORMATS[pageFormat].height * 10;
      const pdfHeight = orientation === 'portrait' ? PAGE_FORMATS[pageFormat].height * 10 : PAGE_FORMATS[pageFormat].width * 10;
      
      const pageElement = containerRef.current?.querySelector('.page') as HTMLElement;
      if (!pageElement) {
        toast.dismiss();
        toast.error("No document found");
        return;
      }
      
      // Temporarily remove zoom
      const originalTransform = pageElement.style.transform;
      pageElement.style.transform = 'none';
      
      if (viewMode && viewModeImages.length > 0) {
        const pageContainers = pageElement.querySelectorAll('[id^="page-"]');
        const targets = pageContainers.length > 0 ? Array.from(pageContainers) : [pageElement];
        
        for (let i = 0; i < targets.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const canvas = await html2canvas(targets[i] as HTMLElement, {
            scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
      } else {
        // Edit mode: capture each page
        if (editorRef.current) {
          const updatedPages = [...pages];
          updatedPages[currentPage - 1] = editorRef.current.innerHTML;
          
          for (let i = 0; i < updatedPages.length; i++) {
            if (i !== currentPage - 1 && editorRef.current) {
              editorRef.current.innerHTML = updatedPages[i] || '<p>Empty page</p>';
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            const canvas = await html2canvas(pageElement, {
              scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          }
          
          // Restore original page
          if (editorRef.current) {
            editorRef.current.innerHTML = pages[currentPage - 1] || '';
          }
        }
      }
      
      pageElement.style.transform = originalTransform;
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.dismiss();
      toast.success(`Document ready for printing`);
    } catch (error) {
      console.error('Print error:', error);
      toast.dismiss();
      toast.error("Failed to prepare document for printing");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Generating PDF...");
      
      let pdf = new jsPDF(orientation === 'portrait' ? 'p' : 'l', 'mm', pageFormat);
      const pdfWidth = orientation === 'portrait' ? PAGE_FORMATS[pageFormat].width * 10 : PAGE_FORMATS[pageFormat].height * 10;
      const pdfHeight = orientation === 'portrait' ? PAGE_FORMATS[pageFormat].height * 10 : PAGE_FORMATS[pageFormat].width * 10;
      
      if (viewMode && viewModeImages.length > 0) {
        // VIEW MODE: Canvas-based export that draws edits directly onto captured images
        const pageContainers = containerRef.current?.querySelectorAll('[id^="page-"]');
        
        if (!pageContainers || pageContainers.length === 0) {
          toast.dismiss();
          toast.error("No document pages found");
          return;
        }

        // Pre-compute scale factor for text overlay positions
        const pageCssWidthPx = getPageDimensions().width * CM_TO_PX;
        const fallbackVp = { width: pageCssWidthPx, height: getPageDimensions().height * CM_TO_PX };
        const vp = editTextViewportSize || fallbackVp;
        const vpW = vp.width;
        const sf = pageCssWidthPx / vpW;
        
        for (let i = 0; i < pageContainers.length; i++) {
          const container = pageContainers[i] as HTMLElement;
          
          // Temporarily remove zoom transform for accurate capture
          const originalTransform = container.style.transform;
          container.style.transform = 'none';
          
          // Scroll into view for accurate capture
          container.scrollIntoView({ behavior: 'instant' as any });
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Capture the base page image (just the PDF image, no edits needed in DOM)
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });
          
          // Restore transform
          container.style.transform = originalTransform;
          
          // DRAW EDITS DIRECTLY ONTO CANVAS using Canvas 2D API
          // This is the most reliable method - bypasses all DOM/React rendering issues
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const canvasScale = 2; // matches html2canvas scale
            
            // Draw edited text spans onto canvas
            if (editTextLayers[i] && editTextLayers[i].length > 0) {
              for (const item of editTextLayers[i]) {
                const drawX = ((item.x * sf) - 1) * canvasScale;
                const drawY = ((item.y * sf) - 1) * canvasScale;
                const drawW = ((item.width * sf) + 2) * canvasScale;
                const drawH = ((item.height * sf) + 2) * canvasScale;
                const drawFontSize = item.fontSize * sf * canvasScale;
                
                // Draw background rectangle to cover original text
                if (item.backgroundColor && item.backgroundColor !== 'transparent') {
                  ctx.fillStyle = item.backgroundColor;
                  ctx.fillRect(drawX, drawY, drawW, drawH);
                }
                
                // Draw the edited text
                const fontStyle = item.fontStyle || 'normal';
                const fontWeight = item.fontWeight || 'normal';
                ctx.font = `${fontStyle} ${fontWeight} ${drawFontSize}px ${item.fontFamily}`;
                ctx.fillStyle = item.color;
                ctx.textBaseline = 'middle';
                
                if (item.letterSpacing) {
                  // Draw character by character for letter spacing
                  let charX = drawX + (1 * canvasScale);
                  const charY = drawY + drawH / 2;
                  const ls = item.letterSpacing * sf * canvasScale;
                  for (const char of item.text) {
                    ctx.fillText(char, charX, charY);
                    charX += ctx.measureText(char).width + ls;
                  }
                } else {
                  ctx.fillText(item.text, drawX + (1 * canvasScale), drawY + drawH / 2);
                }
              }
            }
            
            // Draw overlay text boxes onto canvas
            const pageHeight = getPageDimensions().height * CM_TO_PX;
            for (const box of overlayTextBoxes) {
              const boxPageIndex = Math.floor(box.y / pageHeight);
              if (boxPageIndex !== i) continue;
              
              const localY = box.y - (i * pageHeight);
              const bx = box.x * canvasScale;
              const by = localY * canvasScale;
              const bw = box.width * canvasScale;
              const bh = box.height * canvasScale;
              
              // Draw background
              if (box.backgroundColor && box.backgroundColor !== 'transparent') {
                ctx.fillStyle = box.backgroundColor;
                ctx.fillRect(bx, by, bw, bh);
              }
              
              // Draw text
              if (box.text) {
                ctx.font = `${box.fontSize * canvasScale}px ${box.fontFamily}`;
                ctx.fillStyle = box.color;
                ctx.textBaseline = 'top';
                
                // Simple word-wrap within box
                const words = box.text.split(' ');
                let line = '';
                let lineY = by + (4 * canvasScale); // padding
                const maxWidth = bw - (8 * canvasScale);
                const lineHeight = box.fontSize * canvasScale * 1.2;
                
                for (const word of words) {
                  const testLine = line ? `${line} ${word}` : word;
                  if (ctx.measureText(testLine).width > maxWidth && line) {
                    ctx.fillText(line, bx + (4 * canvasScale), lineY);
                    line = word;
                    lineY += lineHeight;
                    if (lineY > by + bh) break;
                  } else {
                    line = testLine;
                  }
                }
                if (line && lineY <= by + bh) {
                  ctx.fillText(line, bx + (4 * canvasScale), lineY);
                }
              }
            }
          }
          
          const imgData = canvas.toDataURL('image/png');
          
          // Set PDF page size to match captured image exactly (eliminates white gaps)
          const imgWidthMM = (canvas.width / 2) * 0.264583; // px to mm at 96dpi
          const imgHeightMM = (canvas.height / 2) * 0.264583;
          
          if (i === 0) {
            // First page: set the PDF size to match
            pdf = new jsPDF({
              orientation: imgWidthMM > imgHeightMM ? 'landscape' : 'portrait',
              unit: 'mm',
              format: [imgWidthMM, imgHeightMM]
            });
          } else {
            pdf.addPage([imgWidthMM, imgHeightMM], imgWidthMM > imgHeightMM ? 'landscape' : 'portrait');
          }
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMM, imgHeightMM);
        }
        
        // Log signature count
        const signatureElements = containerRef.current?.querySelectorAll('.signature-element');
        if (signatureElements && signatureElements.length > 0) {
          console.log(`📄 Export - ${signatureElements.length} signatures included`);
        }
        
      } else {
        // EDIT MODE: Capture the actual page element directly (includes signatures & overlays)
        const pageElement = containerRef.current?.querySelector('.page') as HTMLElement;
        if (!pageElement) {
          toast.dismiss();
          toast.error("No document found");
          return;
        }
        
        // Save current page content
        if (editorRef.current) {
          const currentContent = editorRef.current.innerHTML;
          const updatedPages = [...pages];
          updatedPages[currentPage - 1] = currentContent;
          
          // Temporarily remove zoom for accurate capture
          const originalTransform = pageElement.style.transform;
          pageElement.style.transform = 'none';
          
          for (let i = 0; i < updatedPages.length; i++) {
            // Navigate to each page to render it
            if (i !== currentPage - 1 && editorRef.current) {
              editorRef.current.innerHTML = updatedPages[i] || '<p>Empty page</p>';
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const canvas = await html2canvas(pageElement, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          }
          
          // Restore original page
          if (editorRef.current) {
            editorRef.current.innerHTML = updatedPages[currentPage - 1] || '';
          }
          pageElement.style.transform = originalTransform;
        }
      }
      
      pdf.save(`${projectTitle || 'Document'}.pdf`);
      toast.dismiss();
      toast.success(`PDF exported successfully!`);
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.dismiss();
      toast.error("Failed to export PDF");
    }
  };

  // Helper function to get current page dimensions based on format and orientation
  // Page management functions
  const addPage = () => {
    // Handle uploaded PDF files (viewMode with images)
    if (viewMode && viewModeImages.length > 0) {
      // Create a blank white page image (data URL for a white rectangle matching page dimensions)
      const pageDims = getPageDimensions();
      const w = Math.round(pageDims.width * CM_TO_PX);
      const h = Math.round(pageDims.height * CM_TO_PX);
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = w;
      blankCanvas.height = h;
      const ctx = blankCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      const blankImage = blankCanvas.toDataURL('image/png');
      const newImages = [...viewModeImages, blankImage];
      setViewModeImages(newImages);
      setTotalPages(newImages.length);
      setCurrentPage(newImages.length);
      // Scroll to new page
      setTimeout(() => {
        const newPageEl = document.getElementById(`page-${newImages.length}`);
        newPageEl?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      toast.success("New page added");
      return;
    }
    
    // Handle uploaded DOCX files (editable pages)
    if (docxEditablePages.length > 0) {
      const blankHtml = `<div style="padding: 2cm; min-height: ${getPageDimensions().height}cm; font-family: inherit;"><p style="font-size: 12pt;">New page...</p></div>`;
      const newPages = [...docxEditablePages, blankHtml];
      setDocxEditablePages(newPages);
      setTotalPages(newPages.length);
      setCurrentPage(newPages.length);
      setTimeout(() => {
        const newPageEl = document.getElementById(`page-${newPages.length}`);
        newPageEl?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      toast.success("New page added");
      return;
    }
    
    // Default: in-house document
    saveCurrentPageContent();
    
    const newPage = `<p style="font-size: 14pt; color: inherit;">New page...</p>`;
    const newPages = [...pages, newPage];
    setPages(newPages);
    setTotalPages(newPages.length);
    setCurrentPage(newPages.length);
    
    // Load new page into editor
    if (editorRef.current) {
      editorRef.current.innerHTML = newPage;
      setDocumentContent(newPage);
    }
    toast.success("New page added");
  };

  const deletePage = (pageNum: number) => {
    if (pages.length <= 1) {
      toast.error("Cannot delete the last page");
      return;
    }
    
    // Save current page first
    saveCurrentPageContent();
    
    const newPages = pages.filter((_, i) => i !== pageNum - 1);
    setPages(newPages);
    setTotalPages(newPages.length);
    
    // Determine which page to show after deletion
    const newCurrentPage = currentPage > newPages.length ? newPages.length : 
                           (pageNum <= currentPage ? Math.max(1, currentPage - 1) : currentPage);
    setCurrentPage(newCurrentPage);
    
    // Load the new current page content
    if (editorRef.current && newPages[newCurrentPage - 1]) {
      editorRef.current.innerHTML = newPages[newCurrentPage - 1];
      setDocumentContent(newPages[newCurrentPage - 1]);
    }
    
    toast.success(`Page ${pageNum} deleted`);
  };

  const duplicatePage = (pageNum: number) => {
    saveCurrentPageContent();
    
    const pageToDuplicate = pages[pageNum - 1];
    const newPages = [...pages];
    newPages.splice(pageNum, 0, pageToDuplicate);
    setPages(newPages);
    setTotalPages(newPages.length);
    
    // Navigate to the duplicated page (inserted after the original)
    const newPageNum = pageNum + 1;
    setCurrentPage(newPageNum);
    if (editorRef.current) {
      editorRef.current.innerHTML = pageToDuplicate;
      setDocumentContent(pageToDuplicate);
    }
    toast.success(`Page ${pageNum} duplicated as page ${newPageNum}`);
  };

  const rotatePage = (pageNum: number) => {
    saveCurrentPageContent();
    
    // Wrap or unwrap the page content with a rotation container
    const newPages = [...pages];
    const content = newPages[pageNum - 1];
    
    // Check if already rotated by looking for our rotation wrapper
    const rotationMatch = content.match(/^<div data-rotation="(\d+)"[^>]*>([\s\S]*)<\/div>$/);
    let newRotation = 90;
    let innerContent = content;
    
    if (rotationMatch) {
      const currentRotation = parseInt(rotationMatch[1]);
      newRotation = (currentRotation + 90) % 360;
      innerContent = rotationMatch[2];
    }
    
    if (newRotation === 0) {
      // Remove rotation wrapper
      newPages[pageNum - 1] = innerContent;
    } else {
      // Apply rotation wrapper
      newPages[pageNum - 1] = `<div data-rotation="${newRotation}" style="transform: rotate(${newRotation}deg); transform-origin: center center; width: 100%; height: 100%;">${innerContent}</div>`;
    }
    
    setPages(newPages);
    
    // If viewing the rotated page, reload it
    if (currentPage === pageNum && editorRef.current) {
      editorRef.current.innerHTML = newPages[pageNum - 1];
      setDocumentContent(newPages[pageNum - 1]);
    }
    
    toast.success(`Page ${pageNum} rotated ${newRotation}°`);
  };

  const movePage = (from: number, to: number) => {
    saveCurrentPageContent();
    
    const newPages = [...pages];
    const [movedPage] = newPages.splice(from - 1, 1);
    newPages.splice(to - 1, 0, movedPage);
    setPages(newPages);
    
    // Update current page to follow the moved page
    if (currentPage === from) {
      setCurrentPage(to);
    } else if (from < to && currentPage > from && currentPage <= to) {
      setCurrentPage(currentPage - 1);
    } else if (from > to && currentPage >= to && currentPage < from) {
      setCurrentPage(currentPage + 1);
    }
    
    // Reload the editor with the current page's content after move
    const newCurrentPage = currentPage === from ? to : currentPage;
    if (editorRef.current && newPages[newCurrentPage - 1]) {
      editorRef.current.innerHTML = newPages[newCurrentPage - 1];
      setDocumentContent(newPages[newCurrentPage - 1]);
    }
    
    toast.success(`Page moved from position ${from} to ${to}`);
  };

  const getPageDimensions = () => {
    const format = PAGE_FORMATS[pageFormat];
    const width = orientation === "portrait" ? format.width : format.height;
    const height = orientation === "portrait" ? format.height : format.width;
    return { width, height };
  };

  // Text box management functions — click-to-place mode
  const addTextBox = () => {
    setPlacingTextBox(true);
    toast.info("Click on the document to place the text box");
  };

  // Handle text box placement via click on document
  useEffect(() => {
    if (!placingTextBox || !containerRef.current) return;
    const container = containerRef.current;
    const pages = Array.from(container.querySelectorAll('.page')) as HTMLElement[];

    const getPageFromPoint = (cx: number, cy: number) => {
      for (const page of pages) {
        const rect = page.getBoundingClientRect();
        if (cy >= rect.top && cy <= rect.bottom && cx >= rect.left && cx <= rect.right) return page;
      }
      return pages[0] || null;
    };

    // Show crosshair cursor
    container.style.cursor = 'crosshair';

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const page = getPageFromPoint(e.clientX, e.clientY);
      if (!page) return;
      const pageRect = page.getBoundingClientRect();
      const pageIndex = pages.indexOf(page);
      const pageHeight = getPageDimensions().height * CM_TO_PX;
      const clickX = (e.clientX - pageRect.left) / zoomLevel;
      const clickY = (e.clientY - pageRect.top) / zoomLevel + (pageIndex * pageHeight);
      const boxW = 200;
      const boxH = 100;
      const newBox: OverlayTextBoxData = {
        id: `textbox_${Date.now()}`,
        x: Math.max(0, clickX - boxW / 2),
        y: Math.max(0, clickY - boxH / 2),
        width: boxW,
        height: boxH,
        text: "",
        fontSize: 14,
        fontFamily: "Arial",
        color: "#000000",
        backgroundColor: "transparent",
        borderVisible: false
      };
      setOverlayTextBoxes(prev => [...prev, newBox]);
      setPlacingTextBox(false);
      toast.success("Text box placed");
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingTextBox(false);
        toast.info("Text box placement cancelled");
      }
    };

    container.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleEscape);
    return () => {
      container.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape);
      container.style.cursor = '';
    };
  }, [placingTextBox, zoomLevel]);

  const updateTextBox = (id: string, updates: Partial<Omit<OverlayTextBoxData, 'id'>>) => {
    setOverlayTextBoxes(boxes =>
      boxes.map(box => box.id === id ? { ...box, ...updates } : box)
    );
  };

  const deleteTextBox = (id: string) => {
    setOverlayTextBoxes(boxes => boxes.filter(box => box.id !== id));
    toast.success("Text box deleted");
  };

  // Color picker function
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Color picker logic
    if (isColorPickerActive && editorRef.current && selectedTextBoxId) {
      const target = e.target as HTMLElement;
      const computedStyle = window.getComputedStyle(target);
      const bgColor = computedStyle.backgroundColor;
      updateTextBox(selectedTextBoxId, { backgroundColor: bgColor });
      toast.success(`Color picked: ${bgColor}`);
      setIsColorPickerActive(false);
      setSelectedTextBoxId(null);
      return;
    }

    // Genius AI bubble trigger — works in edit mode AND in viewMode with editMode on (uploaded files)
    const canTriggerGenius = (!viewMode && !geniusBubblePos) || 
                              (viewMode && editMode && !geniusBubblePos) ||
                              (docxEditablePages.length > 0 && editMode && !geniusBubblePos);
    if (canTriggerGenius) {
      const pageEl = (e.currentTarget as HTMLElement);
      const rect = pageEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGeniusBubblePos({ x, y });
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Desktop Toolbar */}
      <div className="hidden md:block border-b bg-background no-print desktop-toolbar shrink-0 relative z-40">
      <CollapsibleToolbar>
        <div className="flex items-center gap-0.5 flex-nowrap pr-4">
            {/* Font Controls */}
            <Select value={selectedFont} onValueChange={font => {
            setSelectedFont(font);
            if (editorRef.current) editorRef.current.style.fontFamily = font;
          }}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {FONTS.map(font => <SelectItem key={font} value={font} style={{
                fontFamily: font
              }}>
                    {font}
                  </SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedSize} onValueChange={size => {
            setSelectedSize(size);
            if (editorRef.current) editorRef.current.style.fontSize = `${size}px`;
          }}>
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {FONT_SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Text Color & Highlight - next to font size */}
            <div className="flex gap-0.5 border-l pl-1">
              {/* Text Color Picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
                    <div className="relative">
                      <Palette className="h-4 w-4" />
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                        style={{ backgroundColor: selectedTextColor }}
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {TEXT_COLORS.map(color => (
                      <button
                        key={color}
                        className="w-7 h-7 rounded border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedTextColor(color);
                          execCommand("foreColor", color);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Highlight */}
              <Select value={selectedHighlight} onValueChange={activateHighlighter}>
                <SelectTrigger className={`w-10 h-8 text-xs p-0 justify-center ${isHighlighterActive ? 'bg-primary/20 border-primary' : ''}`}>
                  <Highlighter className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {HIGHLIGHT_COLORS.map(color => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border" style={{ backgroundColor: color }} />
                        {color === "transparent" ? "None" : color}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Formatting */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("bold")} title="Bold (Ctrl+B)">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("italic")} title="Italic (Ctrl+I)">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("underline")} title="Underline (Ctrl+U)">
                <Underline className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("strikeThrough")} title="Strikethrough">
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex gap-0.5 border-l pl-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Alignment">
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-0 w-auto p-1">
                  <DropdownMenuItem onClick={() => execCommand("justifyLeft")} className="gap-2 px-2 py-1.5">
                    <AlignLeft className="h-4 w-4" /> Left
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand("justifyCenter")} className="gap-2 px-2 py-1.5">
                    <AlignCenter className="h-4 w-4" /> Center
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand("justifyRight")} className="gap-2 px-2 py-1.5">
                    <AlignRight className="h-4 w-4" /> Right
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand("justifyFull")} className="gap-2 px-2 py-1.5">
                    <AlignJustify className="h-4 w-4" /> Justify
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lists */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertOrderedList")} title="Numbered List">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Version History Navigation */}
            {versions.length > 0 && (
              <div className="flex gap-0.5 border-l pl-1 items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={goToPreviousVersion}
                  disabled={currentVersionIndex <= 0}
                  title="Previous Version"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-1 whitespace-nowrap">
                  {currentVersionIndex + 1}/{versions.length}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={goToNextVersion}
                  disabled={currentVersionIndex >= versions.length - 1}
                  title="Next Version"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            
            {/* Image Upload */}
            <div className="flex gap-0.5 border-l pl-1">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fileInputRef.current?.click()} title="Insert Image">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowUploadDialog(true)} title="Upload Document (PDF, Word, Google Docs)">
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            {/* Calculator */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCalculator(true)} title="Calculator">
                <Calculator className="h-4 w-4" />
              </Button>
            </div>

            {/* Signature & Read Aloud */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSignDialog(true)} title="Add Signature">
                <PenLine className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowTextReader(true)} title="Read Aloud">
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button 
                variant={editMode ? "secondary" : "ghost"}
                size="sm" 
                className="h-8 px-2 text-xs gap-1" 
                onClick={async () => {
                  console.log('[Edit Toggle] viewMode:', viewMode, 'editMode:', editMode, 'uploadedFileType:', uploadedFileType, 'originalFile:', !!originalFile, 'editTextLayers:', editTextLayers.length, 'docxEditablePages:', docxEditablePages.length);
                  if (docxEditablePages.length > 0) {
                    // DOCX Editable Mode: toggle between edit and view
                    if (editMode && originalFile) {
                      // Switch to View Mode: re-parse as images
                      toast.info('Switching to View Mode...');
                      try {
                        const result = await parseDocumentAsImages(originalFile);
                        if (result.images && result.images.length > 0) {
                          setDocxEditablePages([]);
                          setDocxEditableStyles('');
                          setViewMode(true);
                          setViewModeImages(result.images);
                          setEditMode(false);
                          setEditTextLayers([]);
                          setTotalPages(result.images.length);
                          toast.success('View Mode loaded');
                        }
                      } catch (err) {
                        console.error('Failed to switch to view mode:', err);
                        toast.error('Failed to switch mode');
                      }
                    } else {
                      setEditMode(true);
                    }
                  } else if (viewMode && viewModeImages.length > 0) {
                    // View mode with images - check if DOCX to allow editable switch
                    if (!editMode && uploadedFileType === 'docx' && originalFile) {
                      // Switch to DOCX Editable Mode
                      toast.info('Switching to Edit Mode...');
                      try {
                        const result = await parseDocumentForEditing(originalFile);
                        if (result.editablePages && result.editablePages.length > 0) {
                          setViewMode(false);
                          setViewModeImages([]);
                          setDocxEditablePages(result.editablePages);
                          setDocxEditableStyles(result.pages?.[0] || '');
                          setEditMode(true);
                          setEditTextLayers([]);
                          setTotalPages(result.editablePages.length);
                          toast.success('Edit Mode loaded');
                        }
                      } catch (err) {
                        console.error('Failed to switch to edit mode:', err);
                        toast.error('Failed to switch mode');
                      }
                    } else if (!editMode && uploadedFileType === 'pdf' && editTextLayers.length === 0 && originalFile) {
                      // PDF: switch from View to Edit — re-parse to get text layers
                      toast.info('Loading text layers for editing...');
                      try {
                        const result = await parseDocumentForEditing(originalFile);
                        if (result.textLayers && result.textLayers.length > 0) {
                          setEditTextLayers(result.textLayers);
                          if (result.metadata?.dimensions) {
                            setEditTextViewportSize(result.metadata.dimensions);
                          }
                          setEditMode(true);
                          toast.success('Edit mode ready — click text to edit');
                        } else {
                          // No text layers found, enable annotation-only mode
                          setEditMode(true);
                          toast.info('Edit mode enabled — use Text Box tool to annotate');
                        }
                      } catch (err) {
                        console.error('Failed to load text layers:', err);
                        setEditMode(true);
                        toast.info('Edit mode enabled — use Text Box tool to annotate');
                      }
                    } else if (!editMode && uploadedFileType === 'pdf' && editTextLayers.length > 0) {
                      // PDF: text layers already loaded (from initial upload or restore) — just toggle
                      console.log('[Edit Toggle] PDF text layers already loaded, toggling editMode on');
                      setEditMode(true);
                      toast.success('Edit mode ready — click text to edit');
                    } else {
                      // Toggle overlay edit mode for PDF (hybrid approach)
                      setEditMode(!editMode);
                      if (!editMode && editTextLayers.length === 0) {
                        toast.info('Edit mode enabled — use Text Box tool to annotate');
                      }
                    }
                  } else {
                    const newEditMode = !editMode;
                    setEditMode(newEditMode);
                    if (editorRef.current) {
                      editorRef.current.contentEditable = String(newEditMode);
                      editorRef.current.style.cursor = newEditMode ? 'text' : 'default';
                    }
                  }
                }}
                title={editMode ? "Switch to View Mode" : "Switch to Edit Mode"}
              >
                {editMode ? <><Eye className="h-4 w-4" /> View</> : <><Edit3 className="h-4 w-4" /> Edit</>}
              </Button>
              {viewMode && (
                <>
                  <Button 
                    variant="ghost"
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={addTextBox}
                    title="Add Text Box"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isColorPickerActive ? "secondary" : "ghost"}
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setIsColorPickerActive(!isColorPickerActive)}
                    title="Color Picker (click element to pick color)"
                  >
                    <Pipette className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Search */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSearchDialog(true)} title="Find (Ctrl+F)">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowShortcutsDialog(true)} title="Keyboard Shortcuts (Ctrl+/)">
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>

            {/* Collaboration - Comments */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button 
                variant={showComments ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setShowComments(!showComments)} 
                title="Toggle Comments"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>

            {/* Pages Panel */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button 
                variant={showPagePanel ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setShowPagePanel(!showPagePanel)} 
                title="Toggle Pages Panel"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>

            {/* Spacer */}
            <div className="ml-auto" />
          </div>
        </CollapsibleToolbar>
      </div>

      {/* Mobile Toolbar */}
      <div className="md:hidden p-1 border-b bg-background shrink-0 no-print mobile-toolbar">
        <MobileToolbar
          groups={[
            {
              label: "Format",
              actions: [
                { icon: Bold, label: "Bold", onClick: () => execCommand("bold"), priority: "high" },
                { icon: Italic, label: "Italic", onClick: () => execCommand("italic"), priority: "high" },
                { icon: Underline, label: "Underline", onClick: () => execCommand("underline"), priority: "medium" },
                { icon: Strikethrough, label: "Strikethrough", onClick: () => execCommand("strikeThrough"), priority: "low" },
                { icon: Palette, label: "Text Color", onClick: () => {
                  // Cycle through common colors
                  const currentIndex = TEXT_COLORS.indexOf(selectedTextColor);
                  const nextColor = TEXT_COLORS[(currentIndex + 1) % TEXT_COLORS.length];
                  setSelectedTextColor(nextColor);
                  execCommand("foreColor", nextColor);
                }, priority: "medium" },
              ]
            },
            {
              label: "Align",
              actions: [
                { icon: AlignLeft, label: "Left", onClick: () => execCommand("justifyLeft"), priority: "medium" },
                { icon: AlignCenter, label: "Center", onClick: () => execCommand("justifyCenter"), priority: "medium" },
                { icon: AlignRight, label: "Right", onClick: () => execCommand("justifyRight"), priority: "medium" },
              ]
            },
            {
              label: "Page",
              actions: [
                { icon: FileType, label: "Format", onClick: () => {
                  const formats: PageFormat[] = ["letter", "legal", "a4", "a5"];
                  const currentIndex = formats.indexOf(pageFormat);
                  setPageFormat(formats[(currentIndex + 1) % formats.length]);
                }, priority: "low" },
                { icon: FlipHorizontal, label: "Rotate", onClick: () => setOrientation(orientation === "portrait" ? "landscape" : "portrait"), priority: "low" },
                { icon: viewMode ? Edit3 : Eye, label: viewMode ? "Edit" : "View", onClick: async () => {
                  console.log('[Mobile Edit Toggle] viewMode:', viewMode, 'editMode:', editMode, 'uploadedFileType:', uploadedFileType, 'originalFile:', !!originalFile, 'editTextLayers:', editTextLayers.length);
                  if (viewMode && viewModeImages.length > 0) {
                    if (!editMode && uploadedFileType === 'pdf' && editTextLayers.length === 0 && originalFile) {
                      toast.info('Loading text layers for editing...');
                      try {
                        const result = await parseDocumentForEditing(originalFile);
                        if (result.textLayers && result.textLayers.length > 0) {
                          setEditTextLayers(result.textLayers);
                          if (result.metadata?.dimensions) {
                            setEditTextViewportSize(result.metadata.dimensions);
                          }
                          setEditMode(true);
                          toast.success('Edit mode ready — click text to edit');
                        } else {
                          setEditMode(true);
                          toast.info('Edit mode enabled — use Text Box tool to annotate');
                        }
                      } catch (err) {
                        console.error('Failed to load text layers:', err);
                        setEditMode(true);
                        toast.info('Edit mode enabled — use Text Box tool to annotate');
                      }
                    } else if (!editMode && uploadedFileType === 'pdf' && editTextLayers.length > 0) {
                      setEditMode(true);
                      toast.success('Edit mode ready — click text to edit');
                    } else {
                      setEditMode(!editMode);
                    }
                  } else {
                    setViewMode(!viewMode);
                  }
                }, priority: "medium" },
              ]
            },
            {
              label: "Insert",
              actions: [
                { icon: Upload, label: "Upload Doc", onClick: () => setShowUploadDialog(true), priority: "high" },
                { icon: Image, label: "Image", onClick: () => fileInputRef.current?.click(), priority: "medium" },
                { icon: PenLine, label: "Signature", onClick: () => setShowSignDialog(true), priority: "low" },
                { icon: List, label: "Bullet List", onClick: () => execCommand("insertUnorderedList"), priority: "low" },
                { icon: ListOrdered, label: "Numbered List", onClick: () => execCommand("insertOrderedList"), priority: "low" },
              ]
            },
            {
              label: "Tools",
              actions: [
                { icon: Calculator, label: "Calculator", onClick: () => setShowCalculator(true), priority: "low" },
                { icon: Search, label: "Find", onClick: () => setShowSearchDialog(true), priority: "medium" },
                { icon: Volume2, label: "Read Aloud", onClick: () => setShowTextReader(true), priority: "medium" },
                { icon: Highlighter, label: "Highlight", onClick: () => activateHighlighter(selectedHighlight), priority: "low" },
                { icon: Keyboard, label: "Shortcuts", onClick: () => setShowShortcutsDialog(true), priority: "low" },
              ]
            },
          ]}
          rightActions={[
            { icon: MessageSquare, label: "Comments", onClick: () => setShowComments(!showComments), priority: "high" as const, variant: showComments ? ("default" as const) : ("outline" as const) },
            ...(viewMode ? [
              { icon: Plus, label: "Add Box", onClick: addTextBox, priority: "high" as const },
              { icon: Pipette, label: "Pick Color", onClick: () => setIsColorPickerActive(!isColorPickerActive), priority: "medium" as const, variant: isColorPickerActive ? ("default" as const) : ("outline" as const) },
            ] : []),
          ]}
        />
      </div>

      {/* Zoom and Page Navigation Controls */}
      <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 border-b bg-background shrink-0 no-print zoom-controls page-navigation flex-wrap sm:flex-nowrap">
        {/* Left: Page Format & Mode */}
        <div className="flex items-center gap-1 order-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-1.5 text-xs gap-1 text-muted-foreground hover:text-foreground">
                <FileType className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{PAGE_FORMATS[pageFormat].name}</span>
                <span className="sm:hidden">{pageFormat.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-background z-50">
              {Object.entries(PAGE_FORMATS).map(([key, format]) => (
                <DropdownMenuItem 
                  key={key} 
                  onClick={() => setPageFormat(key as PageFormat)}
                  className={pageFormat === key ? 'bg-primary/10' : ''}
                >
                  {format.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOrientation(orientation === "portrait" ? "landscape" : "portrait")}>
                <FlipHorizontal className="h-4 w-4 mr-2" />
                {orientation === "portrait" ? "Landscape" : "Portrait"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(viewMode || uploadSource === 'edit') && (
            <span className="flex items-center gap-0.5 text-xs text-primary font-medium px-1.5 py-0.5 bg-primary/10 rounded">
              {editMode ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {editMode ? 'Edit' : 'View'}
            </span>
          )}
          
          {isColorPickerActive && (
            <span className="flex items-center gap-0.5 text-xs text-accent font-medium animate-pulse">
              <Pipette className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Center: Zoom + Page Navigation (unified row) */}
        <div className="flex items-center gap-1 order-2 flex-1 justify-center min-w-0">
          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))} disabled={zoomLevel <= 0.25}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button 
              onClick={() => setZoomLevel(1.0)} 
              className="text-xs font-medium min-w-[38px] text-center px-1 py-0.5 rounded hover:bg-muted transition-colors cursor-pointer"
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.25))} disabled={zoomLevel >= 3.0}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-border mx-0.5 hidden sm:block" />

          {/* Page Nav */}
          {((viewMode && viewModeImages.length > 0) || (!viewMode && (effectiveTotalPages > 0 || documentContent))) && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={() => { const cur = viewMode ? visiblePage : currentPage; handlePageSelect(Math.max(1, cur - 1)); }}
                disabled={(viewMode ? visiblePage : currentPage) <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded min-w-[60px] text-center whitespace-nowrap">
                {viewMode ? visiblePage : currentPage} / {effectiveTotalPages}
              </span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                onClick={() => { const cur = viewMode ? visiblePage : currentPage; handlePageSelect(Math.min(effectiveTotalPages, cur + 1)); }}
                disabled={(viewMode ? visiblePage : currentPage) >= effectiveTotalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={addPage} title="Add Page">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: Save/Export */}
        <div className="flex items-center gap-1 order-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-1.5 gap-1 text-xs">
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem onClick={handleQuickSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {currentProjectId ? "Quick Save" : "Save to My Files"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadHTML}>
                <FileText className="h-4 w-4 mr-2" />
                Save as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadDOCX}>
                <FileText className="h-4 w-4 mr-2" />
                Save as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <FileText className="h-4 w-4 mr-2" />
                Print Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area with Page Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page Management Panel */}
        {showPagePanel && (
          <div className="w-64 border-r bg-background shrink-0 z-50 relative h-full overflow-auto shadow-lg">
            <PageManagementPanel
              numPages={effectiveTotalPages}
              currentPage={currentPage}
              onPageSelect={handlePageSelect}
              onAddPage={addPage}
              onDeletePage={deletePage}
              onDuplicatePage={duplicatePage}
              onMovePage={movePage}
            />
          </div>
        )}

      {/* Main Editor Area - Reduced padding for mobile */}
      <div ref={wrapperRef} className="flex-1 overflow-auto scroll-smooth bg-muted/30 flex gap-0 items-start justify-center py-2 md:py-4" style={{
        scrollBehavior: 'smooth'
      }}>
        {/* Live Cursors */}
        {currentProjectId && (
          <LiveCursors cursors={cursors} containerRef={containerRef} />
        )}
        <style>{`
          .page {
            width: ${getPageDimensions().width}cm;
            max-width: ${getPageDimensions().width}cm;
            padding: 0;
            background: ${isDarkMode ? 'black' : 'white'};
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
            margin: 0 auto;
            flex-shrink: 0;
          }
          
          .page:not(.view-mode-page) {
            transform: scale(${zoomLevel});
            transform-origin: top center;
            transition: transform 0.2s ease;
            height: ${getPageDimensions().height}cm;
          }
          
          .page.view-mode-page {
            height: auto;
            overflow: visible;
            margin-bottom: 0 !important;
          }
          
          .page-content {
            /* Use calc for precise content area height minus padding */
            width: 100%;
            height: ${getPageDimensions().height}cm;
            padding: ${MARGIN_CM}cm;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            display: block;
          }
          
          /* Ensure all children respect boundaries */
          .page-content > * {
            max-width: 100%;
            box-sizing: border-box;
          }
          
          /* Custom scrollbar for page content */
          .page-content::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .page-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
          }
          
          .page-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
          }
          
          .page-content::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
          
          /* View mode visual indicator */
          .page.view-mode {
            border: 3px solid hsl(var(--primary) / 0.3);
          }
          
          /* Disable text selection cursor in view mode */
          .page.view-mode .page-content > div {
            cursor: default;
          }
          
          .page .uploaded-content,
          .page > div {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }
          
          .page .pdf-page-wrapper,
          .page .docx-page-wrapper {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            overflow: hidden;
          }
          
          .page .pdf-page,
          .page .docx-page {
            max-width: 100% !important;
            max-height: 100% !important;
            pointer-events: auto;
          }
          
          .page img {
            max-width: 100%;
            height: auto;
            object-fit: contain;
            cursor: move;
            pointer-events: auto;
          }

          /* PDF Reconstructed Page - Constrained to page dimensions */
          .pdf-page-reconstructed {
            position: relative;
            background: white;
            margin: 0;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            overflow: hidden;
            padding: 0;
            box-sizing: border-box;
          }
          
          .pdf-page-reconstructed > * {
            max-width: 100%;
            overflow: visible;
          }

          /* PDF Logo images - higher z-index */
          .pdf-logo {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          /* PDF Text Spans - Clean and minimal */
          .pdf-text-span {
            pointer-events: auto;
            cursor: text;
            transition: background-color 0.15s;
          }

          .page.edit-mode .pdf-text-span:hover {
            background: rgba(66, 153, 225, 0.1) !important;
          }

          .page.edit-mode .pdf-text-span:focus {
            background: rgba(66, 153, 225, 0.15) !important;
            outline: 1px solid rgba(66, 153, 225, 0.5);
          }

          /* PDF Reconstructed Tables */
          .pdf-reconstructed-table {
            position: absolute;
            border-collapse: collapse;
            background: white;
            pointer-events: auto;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            
            /* CRITICAL: Ensure tables never exceed page boundaries */
            max-width: calc(100% - ${MARGIN_CM * 2}cm) !important;
            max-height: calc(100% - ${MARGIN_CM * 2}cm) !important;
          }

          .pdf-reconstructed-table td,
          .pdf-reconstructed-table th {
            border: 1px solid #999;
            padding: 6px;
            min-width: 40px;
            vertical-align: top;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            word-wrap: break-word;
            transition: background-color 0.15s;
          }

          .pdf-reconstructed-table th {
            background: #f5f5f5;
            font-weight: 600;
          }

          .page.edit-mode .pdf-reconstructed-table th:hover,
          .page.edit-mode .pdf-reconstructed-table td:hover {
            background-color: rgba(66, 153, 225, 0.08) !important;
          }

          .page.edit-mode .pdf-reconstructed-table th:focus,
          .page.edit-mode .pdf-reconstructed-table td:focus {
            background-color: rgba(66, 153, 225, 0.12) !important;
            outline: 2px solid rgba(66, 153, 225, 0.5);
            outline-offset: -2px;
          }

          /* PDF Image Wrappers */
          .pdf-image-wrapper {
            position: absolute;
            cursor: move;
            border: 2px solid transparent;
            transition: border-color 0.2s;
          }

          .page.edit-mode .pdf-image-wrapper:hover {
            border-color: rgba(66, 153, 225, 0.5);
          }
          
          /* List Styles */
          .page ul {
            list-style-type: disc;
            padding-left: 40px;
            margin: 16px 0;
          }
          
          .page ol {
            list-style-type: decimal;
            padding-left: 40px;
            margin: 16px 0;
          }
          
          .page li {
            margin: 8px 0;
            padding-left: 8px;
            display: list-item;
          }
          
          /* Nested lists */
          .page ul ul {
            list-style-type: circle;
            margin: 4px 0;
          }
          
          .page ul ul ul {
            list-style-type: square;
          }
          
          .page ol ol {
            list-style-type: lower-alpha;
            margin: 4px 0;
          }
          
          .page ol ol ol {
            list-style-type: lower-roman;
          }
          
          /* Signature hover styles */
          .signature-element:hover {
            border-color: #ccc !important;
          }
          
          @media print {
            /* Hide all UI elements */
            .no-print,
            .desktop-toolbar,
            .mobile-toolbar,
            .floating-action-menu,
            .comments-sidebar,
            .page-navigation,
            .zoom-controls,
            .ai-toolbar {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Reset body and html for printing */
            body, html {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Make page content print properly */
            .page {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              transform: none !important;
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              page-break-after: always;
              break-after: page;
            }
            
            .page-content {
              padding: 1cm !important;
            }
            
            /* Hide the wrapper styling */
            .editor-wrapper {
              background: white !important;
              padding: 0 !important;
              overflow: visible !important;
            }
          }
        `}</style>
        <div ref={containerRef} className="mx-auto pb-0" style={{ 
          width: 'fit-content',
          minHeight: (viewMode || docxEditablePages.length > 0) ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'visible',
          ...(viewMode && viewModeImages.length > 0 ? {
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          } : {}),
          ...(docxEditablePages.length > 0 ? {
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          } : {})
        }}>
          {viewMode && viewModeImages.length > 0 ? (
            // VIEW MODE: Each image gets its own page container for proper sizing
            <>
              {viewModeImages.map((imageSrc, index) => (
                <div 
                  key={`page-${index + 1}`}
                  id={`page-${index + 1}`}
                  className="page view-mode-page"
                  style={{ 
                    position: 'relative',
                    height: 'auto',
                    overflow: 'visible',
                    marginBottom: '0px'
                  }}
                  onClick={handleCanvasClick}
                >
                  {/* Page number removed - navigation bar shows current page */}
                  
                  <img 
                    src={imageSrc}
                    alt={`Page ${index + 1}`}
                    onLoad={() => console.log(`✓ Page ${index + 1} loaded`)}
                    onError={(e) => {
                      console.error(`✗ Page ${index + 1} failed`, e);
                      toast.error(`Failed to load page ${index + 1}`);
                    }}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                  
                   {/* Hybrid Edit Mode: Editable text layer over the image */}
                   {editMode && editTextLayers[index] && editTextLayers[index].length > 0 && (
                     <div 
                       className="absolute inset-0" 
                       style={{ 
                         pointerEvents: 'none',
                         zIndex: 10,
                       }}
                     >
                       {(() => {
                         const pageCssWidthPx = getPageDimensions().width * CM_TO_PX;
                         const fallbackVp = { width: pageCssWidthPx, height: getPageDimensions().height * CM_TO_PX };
                         const vp = editTextViewportSize || fallbackVp;
                         const vpW = vp.width;
                         const sf = pageCssWidthPx / vpW;
                         
                         return editTextLayers[index].map((item: any, textIdx: number) => (
                           <span
                             key={`text-${index}-${textIdx}`}
                             contentEditable
                             suppressContentEditableWarning
                             className="pdf-text-span"
                             data-original-text={item.text}
                              style={{
                                position: 'absolute',
                                left: `${(item.x * sf) - 1}px`,
                                top: `${(item.y * sf) - 1}px`,
                                width: `${(item.width * sf) + 2}px`,
                                height: `${(item.height * sf) + 2}px`,
                                fontSize: `${item.fontSize * sf}px`,
                                fontFamily: item.fontFamily,
                                fontWeight: item.fontWeight,
                                fontStyle: item.fontStyle,
                                letterSpacing: item.letterSpacing ? `${item.letterSpacing * sf}px` : 'normal',
                                color: item.color,
                                lineHeight: `${(item.height * sf) + 2}px`,
                                whiteSpace: 'nowrap',
                                cursor: 'text',
                                background: item.backgroundColor,
                                border: 'none',
                                outline: 'none',
                                pointerEvents: 'auto',
                                padding: '1px 1px',
                                margin: 0,
                                caretColor: item.color,
                                overflow: 'hidden',
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.outline = '1px solid hsl(var(--primary) / 0.5)';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.outline = 'none';
                               }}
                            >
                             {item.text}
                           </span>
                         ));
                       })()}
                     </div>
                   )}
                  
                  
                  {/* Overlay Text Boxes for this page */}
                  {overlayTextBoxes
                    .filter(box => {
                      // Determine which page this text box belongs to based on Y position
                      const pageHeight = getPageDimensions().height * CM_TO_PX;
                      const pageIndex = Math.floor(box.y / pageHeight);
                      return pageIndex === index;
                    })
                    .map(box => (
                      <OverlayTextBox
                        key={box.id}
                        {...box}
                        y={box.y - (index * getPageDimensions().height * CM_TO_PX)}
                        onUpdate={updateTextBox}
                        onDelete={deleteTextBox}
                        zoomLevel={zoomLevel}
                      />
                    ))
                  }
                </div>
              ))}
            </>
          ) : docxEditablePages.length > 0 ? (
            // DOCX EDITABLE MODE: Real editable HTML pages with original layout
            <>
              {/* Inject docx-preview styles */}
              {docxEditableStyles && (
                <div dangerouslySetInnerHTML={{ __html: docxEditableStyles }} style={{ display: 'none' }} />
              )}
              {docxEditablePages.map((pageHtml, index) => (
                <div
                  key={`docx-edit-page-${index + 1}`}
                  id={`page-${index + 1}`}
                  className="page view-mode-page"
                  style={{
                    position: 'relative',
                    overflow: 'visible',
                    marginBottom: '0px',
                    background: isDarkMode ? '#1a1a1a' : 'white',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                  }}
                  onClick={handleCanvasClick}
                >
                  <div
                    contentEditable={editMode}
                    suppressContentEditableWarning
                    className="docx-editable-page"
                    style={{
                      width: '100%',
                      minHeight: `${getPageDimensions().height}cm`,
                      outline: 'none',
                      cursor: editMode ? 'text' : 'default',
                      pointerEvents: editMode ? 'auto' : 'none',
                      userSelect: editMode ? 'auto' : 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: pageHtml }}
                  />
                  
                  {/* Overlay Text Boxes for this page */}
                  {overlayTextBoxes
                    .filter(box => {
                      const pageHeight = getPageDimensions().height * CM_TO_PX;
                      const pageIndex = Math.floor(box.y / pageHeight);
                      return pageIndex === index;
                    })
                    .map(box => (
                      <OverlayTextBox
                        key={box.id}
                        {...box}
                        y={box.y - (index * getPageDimensions().height * CM_TO_PX)}
                        onUpdate={updateTextBox}
                        onDelete={deleteTextBox}
                        zoomLevel={zoomLevel}
                      />
                    ))
                  }
                </div>
              ))}
            </>
          ) : (
            // EDIT MODE: Single page container
            <div 
              className={`page ${editMode ? 'edit-mode' : 'view-mode'}`} 
              style={{ position: 'relative' }}
              onClick={handleCanvasClick}
            >
              <div className="page-content">
                <div
                  ref={editorRef} 
                  contentEditable={!viewMode}
                  className="outline-none prose prose-lg max-w-none" 
                  style={{
                    fontFamily: selectedFont,
                    fontSize: `${selectedSize}px`,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                    color: isDarkMode ? "#ffffff" : "#000000",
                    pointerEvents: viewMode ? 'none' : 'auto',
                    userSelect: viewMode ? 'none' : 'auto',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  suppressContentEditableWarning
                  onFocus={() => setIsEditingText(true)}
                  onBlur={() => setIsEditingText(false)}
                  onClick={(e) => {
                    if (currentProjectId && !viewMode) {
                      updateCursor(e.clientX, e.clientY);
                    }
                  }}
                />
              </div>
            
            {/* AI Toolbar Integration */}
              <AIToolbar 
                onInsertText={(text) => {
                  if (!editorRef.current || viewMode) return;
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);
                  } else {
                    editorRef.current.innerHTML += `<p>${text}</p>`;
                  }
                }}
                isDarkMode={isDarkMode}
                isEditMode={isEditingText && !viewMode}
              />
              
              {/* Overlay Text Boxes in Edit Mode */}
              {!viewMode && overlayTextBoxes.map(box => (
                <OverlayTextBox
                  key={box.id}
                  {...box}
                  onUpdate={updateTextBox}
                  onDelete={deleteTextBox}
                  zoomLevel={zoomLevel}
                />
              ))}
              
              {/* Signature preview while dragging */}
              {draggingSignature && signaturePreviewPosition && (
                <div
                  style={{
                    position: 'absolute',
                    left: signaturePreviewPosition.x,
                    top: signaturePreviewPosition.y,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    opacity: 0.6,
                    zIndex: 1000,
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '2px dashed #3b82f6',
                    borderRadius: '4px',
                  }}
                >
                  {draggingSignature.type === "draw" ? (
                    <img src={draggingSignature.data} alt="Signature preview" style={{ height: '35px', display: 'block' }} />
                  ) : (
                    <span style={{ fontFamily: 'cursive', fontSize: '18px', color: '#000' }}>
                      {draggingSignature.data}
                    </span>
                  )}
                </div>
              )}
              
              {/* Signature placement indicator */}
              {draggingSignature && !signaturePreviewPosition && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setDraggingSignature(null); setSignaturePreviewPosition(null); }}
                    className="shadow-lg bg-background"
                  >
                    ✕ Cancel
                  </Button>
                </div>
              )}

              {/* Text box placement indicator */}
              {placingTextBox && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex gap-2 items-center">
                  <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Click to place text box</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setPlacingTextBox(false); }}
                    className="shadow-lg bg-background"
                  >
                    ✕ Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Genius AI Bubble - rendered outside page to avoid overflow:hidden clipping */}
          {geniusBubblePos && (
            <div className="fixed z-[200] no-print" style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}>
              <div style={{ pointerEvents: 'auto' }}>
                <GeniusAIBubble
                  triggerPosition={geniusBubblePos}
                  isDarkMode={isDarkMode}
                  onDismiss={() => setGeniusBubblePos(null)}
                  onInsertText={(html) => {
                    // Handle uploaded PDF files (viewMode) — create overlay text box with content
                    if (viewMode && viewModeImages.length > 0) {
                      const pageHeight = getPageDimensions().height * CM_TO_PX;
                      const pageIndex = currentPage - 1;
                      const boxY = (pageIndex * pageHeight) + 50;
                      const newBox: OverlayTextBoxData = {
                        id: `genius-${Date.now()}`,
                        x: 50,
                        y: boxY,
                        width: (getPageDimensions().width * CM_TO_PX) - 100,
                        height: Math.min(400, pageHeight - 100),
                        text: html.replace(/<[^>]*>/g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
                        fontSize: 12,
                        fontFamily: 'Arial',
                        color: '#000000',
                        backgroundColor: '#ffffff',
                        borderVisible: false,
                      };
                      setOverlayTextBoxes(prev => [...prev, newBox]);
                      setGeniusBubblePos(null);
                      toast.success("Genius AI content added as text box");
                      return;
                    }
                    
                    // Handle uploaded DOCX files — insert into the editable page
                    if (docxEditablePages.length > 0) {
                      const pageIndex = currentPage - 1;
                      const pageEl = document.querySelector(`#page-${currentPage} .docx-editable-page`) as HTMLElement;
                      if (pageEl) {
                        pageEl.innerHTML += html;
                        setDocxEditablePages(prev => {
                          const newPages = [...prev];
                          newPages[pageIndex] = pageEl.innerHTML;
                          return newPages;
                        });
                      }
                      setGeniusBubblePos(null);
                      toast.success("Genius AI content inserted");
                      return;
                    }
                    
                    // Default: in-house document
                    if (!editorRef.current) return;
                    
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const blocks = Array.from(tempDiv.children);
                    
                    if (blocks.length === 0) {
                      editorRef.current.innerHTML += html;
                    } else {
                      for (const block of blocks) {
                        editorRef.current.appendChild(block.cloneNode(true));
                      }
                    }
                    
                    setDocumentContent(editorRef.current.innerHTML);
                    setPages(prevPages => {
                      const newPages = [...prevPages];
                      newPages[currentPage - 1] = editorRef.current!.innerHTML;
                      return newPages;
                    });
                    setGeniusBubblePos(null);
                    
                    const recursiveOverflowCheck = (iteration: number) => {
                      if (iteration > 200) return;
                      setTimeout(() => {
                        checkAndHandleOverflow();
                        const editor = editorRef.current;
                        if (!editor) return;
                        const pageContentEl = editor.parentElement;
                        const maxH = pageContentEl 
                          ? pageContentEl.clientHeight - 2 
                          : ((getPageDimensions().height - MARGIN_CM * 2) * CM_TO_PX);
                        if (editor.scrollHeight > maxH + 2) {
                          recursiveOverflowCheck(iteration + 1);
                        }
                      }, 150);
                    };
                    recursiveOverflowCheck(0);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Comments Sidebar */}
        {showComments && currentProjectId && (
          <div className="no-print comments-sidebar">
            <CommentsSidebar
            comments={comments}
            onAddComment={async (content) => {
              await addComment(content);
            }}
            onUpdateComment={updateComment}
            onDeleteComment={deleteComment}
            currentUserId={user?.id}
          />
          </div>
        )}
      </div>
      </div>

      {/* Floating Action Menu */}
      <div className="no-print floating-action-menu">
        <FloatingActionMenu />
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentProjectId ? "Save Document" : "Save New Document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input id="title" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="Enter document title" />
            </div>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              {currentProjectId && (
                <Button variant="secondary" onClick={handleSaveAsNew}>
                  <Save className="h-4 w-4 mr-1" />
                  Save as New File
                </Button>
              )}
              <Button onClick={handleSaveToAccount}>
                <Save className="h-4 w-4 mr-1" />
                {currentProjectId ? "Save" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calculator */}
      <ScientificCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} onInsertResult={insertCalculatorResult} />

      {/* Search Dialog */}
      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSearch={handleSearch}
        matchCount={searchMatches.length}
        currentMatch={currentSearchIndex}
        onNext={goToNextMatch}
        onPrevious={goToPreviousMatch}
        showReplace={false}
      />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        type="document"
      />

      {/* Text Reader */}
      <TextReader
        isOpen={showTextReader}
        onClose={() => setShowTextReader(false)}
        getDocumentText={() => {
          // Gather text from all pages
          const allPages = [...pages];
          if (editorRef.current) allPages[currentPage - 1] = editorRef.current.innerHTML;
          const tempDiv = document.createElement('div');
          return allPages.map(p => { tempDiv.innerHTML = p || ''; return tempDiv.textContent || ''; }).join('\n\n');
        }}
      />

      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-2xl bg-background">
          <DialogHeader>
            <DialogTitle>Add Signature</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw">Draw</TabsTrigger>
                  <TabsTrigger value="text">Type</TabsTrigger>
                </TabsList>
                
                <TabsContent value="draw" className="space-y-3">
                  <div className="relative bg-white rounded p-2">
                    <canvas
                      ref={signCanvasRef}
                      width={600}
                      height={300}
                      className="border border-gray-300 rounded cursor-crosshair w-full"
                      style={{ 
                        backgroundColor: '#ffffff',
                        backgroundImage: 'repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%) 50% / 20px 20px'
                      }}
                      onMouseDown={startDrawingSignature}
                      onMouseMove={drawSignature}
                      onMouseUp={stopDrawingSignature}
                      onMouseLeave={stopDrawingSignature}
                      onTouchStart={(e) => { e.preventDefault(); startDrawingSignature(e.touches[0]); }}
                      onTouchMove={(e) => { e.preventDefault(); drawSignature(e.touches[0]); }}
                      onTouchEnd={stopDrawingSignature}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Draw your signature above on the white canvas. It will be saved with a white background.</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={clearSignCanvas} variant="outline" className="flex-1">
                      Clear
                    </Button>
                    <Button size="sm" onClick={stopDrawingSignature} className="flex-1">
                      Save
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-3">
                  <Label>Signature Text</Label>
                  <Input
                    value={textSignature}
                    onChange={(e) => setTextSignature(e.target.value)}
                    placeholder="Your Name"
                    className="font-signature text-2xl"
                    style={{ fontFamily: "cursive" }}
                  />
                  <Button onClick={addTextSignature} className="w-full">
                    Add Signature
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h3 className="font-medium mb-3">Saved Signatures ({signatures.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between p-2 border rounded bg-white">
                    <div className="flex-1 cursor-pointer" onClick={() => insertSignature(sig)}>
                      {sig.type === "draw" ? (
                        <img src={sig.data} alt="Signature" className="h-12 bg-white" />
                      ) : (
                        <span className="text-xl text-black" style={{ fontFamily: "cursive" }}>
                          {sig.data}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => insertSignature(sig)}>
                        Insert
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSignature(sig.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {signatures.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No signatures yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
                  onFileLoaded={(content, title, metadata, file) => {
                    // Store original file and file type for mode switching
                    if (file) setOriginalFile(file);
                    setUploadedFileType((metadata?.fileType as 'pdf' | 'docx') || null);
                    
                    // Check if content is JSON (view/hybrid/docx-editable mode)
                    try {
                      const parsed = JSON.parse(content);
                      
                      // DOCX Editable Mode
                      if (parsed.mode === 'docx-editable' && parsed.editablePages && Array.isArray(parsed.editablePages)) {
                        setDocxEditablePages(parsed.editablePages);
                        setDocxEditableStyles(parsed.styles || '');
                        setViewMode(false);
                        setViewModeImages([]);
                        setEditMode(true);
                        setEditTextLayers([]);
                        setTotalPages(parsed.editablePages.length);
                        setCurrentPage(1);
                        setVisiblePage(1);
                        setUploadSource(metadata?.uploadMode || 'edit');
                        if (editorRef.current) editorRef.current.innerHTML = '';
                        setDocumentContent('');
                        setProjectTitle(title);
                        setCurrentProjectId(null);
                        const detFormat = parsed.metadata?.detectedFormat || metadata?.detectedFormat;
                        if (detFormat && detFormat in PAGE_FORMATS) {
                          setPageFormat(detFormat as PageFormat);
                        }
                        toast.success(`DOCX loaded: ${parsed.editablePages.length} editable pages`);
                        setShowUploadDialog(false);
                        return;
                      }
                      
                      if ((parsed.mode === 'view' || parsed.mode === 'hybrid') && parsed.images && Array.isArray(parsed.images)) {
                        // Image-based mode - validate images
                        const validImages = parsed.images.filter((img: string) => 
                          typeof img === 'string' && (img.startsWith('data:image/jpeg;base64,') || img.startsWith('data:image/png;base64,'))
                        );
                        if (validImages.length > 0) {
                          setViewMode(true);
                          setViewModeImages(validImages);
                          setDocxEditablePages([]); // Clear editable pages
                          setTotalPages(validImages.length);
                          setCurrentPage(1);
                          setVisiblePage(1);
                          setUploadSource(metadata?.uploadMode || (parsed.mode === 'hybrid' ? 'edit' : 'view'));
                          if (parsed.mode === 'hybrid' && parsed.textLayers) {
                            setEditTextLayers(parsed.textLayers);
                            setEditMode(true);
                            if (parsed.metadata?.dimensions) {
                              setEditTextViewportSize(parsed.metadata.dimensions);
                            }
                          }
                          if (editorRef.current) editorRef.current.innerHTML = '';
                          setDocumentContent('');
                          setProjectTitle(title);
                          setCurrentProjectId(null);
                          const detFormat = parsed.metadata?.detectedFormat || metadata?.detectedFormat;
                          if (detFormat && detFormat in PAGE_FORMATS) {
                            setPageFormat(detFormat as PageFormat);
                          }
                          toast.success(`Document loaded: ${validImages.length} pages`);
                          setShowUploadDialog(false);
                          return;
                        }
                      }
                    } catch {
                      // Not JSON - treat as HTML content
                    }

                    // HTML content (edit mode for DOCX)
                    if (editorRef.current) {
                      const wrapper = document.createElement('div');
                      wrapper.className = 'uploaded-content';
                      wrapper.innerHTML = content;
                      
                      const images = wrapper.querySelectorAll('img');
                      images.forEach(img => {
                        (img as HTMLImageElement).draggable = true;
                        img.addEventListener('dragstart', (e) => {
                          e.dataTransfer?.setData('text/plain', '');
                        });
                      });
                      
                      // Ensure we're NOT in view mode for HTML editing
                      setViewMode(false);
                      setViewModeImages([]);
                      setEditMode(true);
                      setUploadSource(metadata?.uploadMode || 'edit');
                      
                      editorRef.current.innerHTML = '';
                      editorRef.current.appendChild(wrapper);
                      editorRef.current.contentEditable = 'true';
                      editorRef.current.style.cursor = 'text';
                      
                      setProjectTitle(title);
                      setCurrentProjectId(null);
                      
                      // Apply detected format if available
                      const detFormat = metadata?.detectedFormat;
                      if (detFormat && detFormat in PAGE_FORMATS) {
                        setPageFormat(detFormat as PageFormat);
                      }
                      
                      toast.success("Document loaded in Edit Mode");
                    }
                    setShowUploadDialog(false);
                   }}
      />

      {/* Mobile Page Navigation - Fixed at Bottom */}
      {((viewMode && viewModeImages.length > 0) || (!viewMode && (effectiveTotalPages > 0 || documentContent))) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3 z-50 no-print page-navigation">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const cur = viewMode ? visiblePage : currentPage;
                handlePageSelect(Math.max(1, cur - 1));
              }}
              disabled={(viewMode ? visiblePage : currentPage) <= 1}
              className="flex-1 max-w-[100px]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-3 py-2 bg-primary/10 border border-primary/20 rounded-md whitespace-nowrap">
              {viewMode ? visiblePage : currentPage} / {effectiveTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const cur = viewMode ? visiblePage : currentPage;
                handlePageSelect(Math.min(effectiveTotalPages, cur + 1));
              }}
              disabled={(viewMode ? visiblePage : currentPage) >= effectiveTotalPages}
              className="flex-1 max-w-[100px]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}