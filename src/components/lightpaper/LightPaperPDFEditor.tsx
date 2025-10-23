import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import { Canvas as FabricCanvas, PencilBrush, IText, Rect, Circle, Textbox, util as fabricUtil, FabricImage } from "fabric";
import * as fabric from "fabric";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Upload, ZoomIn, ZoomOut, Download, FileText, Pencil, Type, Square, Circle as CircleIcon, Eraser, ChevronLeft, ChevronRight, Save, Trash2, Share2, Image as ImageIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Strikethrough, Check, Pen, Keyboard, Search } from "lucide-react";
import { toast } from "sonner";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SignatureLibrary } from "./SignatureLibrary";
import ShareDialog from "./ShareDialog";
import { supabase } from "@/integrations/supabase/client";
import { TextFormatToolbar } from "./TextFormatToolbar";
import { TextSearchDialog, SearchOptions } from "./TextSearchDialog";
import { CollaborationPresence } from "./CollaborationPresence";
import { PDFActivityPanel } from "./PDFActivityPanel";
import { MobileToolbar } from "./MobileToolbar";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto", "Open Sans", "Lato", "Montserrat"];
const FONT_SIZES = ["8", "10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48"];

interface SavedSignature {
  id: string;
  type: "draw" | "text";
  data: string;
  preview: string;
}

// Interfaces for tracking modifications that will be embedded in PDF
interface TextModification {
  pageNum: number;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface ImageModification {
  pageNum: number;
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShapeModification {
  pageNum: number;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

interface TextReplacement {
  originalX: number;
  originalY: number;
  originalText: string;
  newText: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
  height: number;
}

interface PDFTextItem extends TextItem {
  height: number;
}

interface PDFPageViewport {
  width: number;
  height: number;
  scale: number;
}
interface LightPaperPDFEditorProps {
  selectedProject?: LightPaperProject | null;
}
export function LightPaperPDFEditor({
  selectedProject
}: LightPaperPDFEditorProps = {}) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageWidth, setPageWidth] = useState(800);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<"select" | "text" | "rect" | "circle" | "erase">("select");
  const [signatureMode, setSignatureMode] = useState<"draw" | "text">("draw");
  const [textSignature, setTextSignature] = useState("");
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedFontSize, setSelectedFontSize] = useState("16");
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [canvasInstances, setCanvasInstances] = useState<Map<number, FabricCanvas>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareData, setShareData] = useState<{shareUrl: string, shareToken: string, documentTitle: string} | null>(null);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [sharedDocumentId, setSharedDocumentId] = useState<string | null>(null);
  const [collaborationStatus, setCollaborationStatus] = useState<'viewing' | 'editing' | 'signing'>('viewing');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfTextItems, setPdfTextItems] = useState<Map<number, PDFTextItem[]>>(new Map());
  const [textReplacements, setTextReplacements] = useState<Map<number, TextReplacement[]>>(new Map());
  const [editingTextIndex, setEditingTextIndex] = useState<{pageNum: number, index: number} | null>(null);
  const [pdfDocumentProxy, setPdfDocumentProxy] = useState<PDFDocumentProxy | null>(null);
  const [pageViewports, setPageViewports] = useState<Map<number, PDFPageViewport>>(new Map());
  const [draggingSignature, setDraggingSignature] = useState<SavedSignature | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{x: number, y: number} | null>(null);
  
  // Text formatting state
  const [textFormat, setTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left' as 'left' | 'center' | 'right',
    fontSize: 16,
    lineHeight: 1.2,
  });
  const [formatToolbarPosition, setFormatToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedTextObject, setSelectedTextObject] = useState<fabric.Textbox | null>(null);
  
  // Search state
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchMatches, setSearchMatches] = useState<Array<{ pageNum: number; index: number; textItem: PDFTextItem }>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const textLayerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureDrawingCanvas = useRef<FabricCanvas | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("Untitled PDF");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const {
    saveProject
  } = useLightPaperProjects("pdf");

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'Delete', handler: () => { const canvas = canvasInstances.get(currentPage); const activeObj = canvas?.getActiveObject(); if (activeObj) { canvas?.remove(activeObj); toast.success("Deleted"); } }, description: 'Delete annotation' },
    { key: 'Escape', handler: () => { const canvas = canvasInstances.get(currentPage); canvas?.discardActiveObject(); canvas?.renderAll(); }, description: 'Deselect' },
    { key: '=', ctrl: true, handler: (e) => { e.preventDefault(); setZoom(z => Math.min(z + 0.1, 3)); }, description: 'Zoom in' },
    { key: '-', ctrl: true, handler: (e) => { e.preventDefault(); setZoom(z => Math.max(z - 0.1, 0.5)); }, description: 'Zoom out' },
    { key: 'ArrowLeft', handler: () => setCurrentPage(p => Math.max(1, p - 1)), description: 'Previous page' },
    { key: 'ArrowRight', handler: () => setCurrentPage(p => Math.min(numPages, p + 1)), description: 'Next page' },
    { key: '/', ctrl: true, handler: (e) => { e.preventDefault(); setShowShortcutsDialog(true); }, description: 'Shortcuts' },
    { key: 'f', ctrl: true, handler: (e) => { e.preventDefault(); setShowSearchDialog(true); }, description: 'Search' },
  ], true);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!currentProjectId || !pdfFile) return;
    
    try {
      setIsSaving(true);
      const content = {
        currentPage,
        signatures,
        textReplacements: Array.from(textReplacements.entries()),
        pdfUrl: pdfFile.name // This will need proper storage handling
      };
      await saveProject(projectTitle, "pdf", content, currentProjectId);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [pdfFile, currentPage, signatures, textReplacements, projectTitle, currentProjectId, saveProject]);

  // Responsive container width tracking
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 40); // padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Update collaboration status when tool changes
  useEffect(() => {
    if (tool === 'select') {
      setCollaborationStatus('viewing');
    } else if (signatureMode === 'draw' || signatureMode === 'text') {
      setCollaborationStatus('signing');
    } else {
      setCollaborationStatus('editing');
    }
  }, [tool, signatureMode]);
  useEffect(() => {
    if (!currentProjectId || !pdfFile) return;
    
    const timer = setTimeout(() => {
      autoSave();
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [canvasInstances, textReplacements, autoSave, currentProjectId, pdfFile]);

  // Load project when selectedProject changes
  useEffect(() => {
    const loadProject = async () => {
      if (selectedProject && selectedProject.project_type === "pdf") {
        setCurrentProjectId(selectedProject.id);
        setProjectTitle(selectedProject.title);
        const content = selectedProject.content as any;
        if (content?.pdfUrl) {
          try {
            toast.info("Loading PDF...");

            // Fetch the PDF from storage
            const {
              data,
              error
            } = await supabase.storage.from('feed-media').download(content.pdfUrl);
            if (error) {
              console.error("Download error:", error);
              throw new Error(error.message);
            }

            // Convert blob to File
            const file = new File([data], selectedProject.title, {
              type: 'application/pdf'
            });
            setPdfFile(file);
            setCurrentPage(content.currentPage || 1);
            setSignatures(content.signatures || []);
            toast.success("PDF loaded from MyFiles");
          } catch (error: any) {
            console.error("Error loading PDF:", error);
            toast.error(error.message || "Failed to load PDF file");
          }
        }
      }
    };
    loadProject();
  }, [selectedProject]);
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawingSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawingSignature(true);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const coords = getCanvasCoordinates(e, canvas);
      setLastPos(coords);
    }
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      const coords = getCanvasCoordinates(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      setLastPos(coords);
    }
  };

  const stopDrawingSignature = () => {
    if (isDrawingSignature && signatureCanvasRef.current) {
      const signatureData = signatureCanvasRef.current.toDataURL();
      const newSig: SavedSignature = {
        id: Date.now().toString(),
        type: "draw",
        data: signatureData,
        preview: signatureData
      };
      setSignatures([...signatures, newSig]);
      clearSignatureCanvas();
      toast.success("Signature saved!");
    }
    setIsDrawingSignature(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("PDF file size must be less than 20MB");
      return;
    }

    try {
      setIsLoading(true);
      setPdfFile(file);
      setCurrentPage(1);
      setCanvasInstances(new Map());
      
      // Load original PDF bytes for later modification
      const arrayBuffer = await file.arrayBuffer();
      setOriginalPdfBytes(new Uint8Array(arrayBuffer));
      
      toast.success("PDF loaded successfully!");
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF file");
      setIsLoading(false);
    }
  };
  const onDocumentLoadSuccess = async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setPdfDocumentProxy(pdf);
    setIsLoading(false);
    toast.success(`PDF loaded with ${pdf.numPages} pages`);
    
    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      extractPageText(pdf, i);
    }
  };
  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setIsLoading(false);
    toast.error(`Failed to load PDF: ${error.message}`);
  };

  const extractPageText = async (pdf: PDFDocumentProxy, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      
      const items: PDFTextItem[] = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => ({
          ...item,
          height: item.height || Math.abs(item.transform[3]),
        }));
      
      setPdfTextItems(prev => new Map(prev).set(pageNum, items));
      setPageViewports(prev => new Map(prev).set(pageNum, {
        width: viewport.width,
        height: viewport.height,
        scale: viewport.scale,
      }));
    } catch (error) {
      console.error(`Error extracting text from page ${pageNum}:`, error);
    }
  };

  const handleTextClick = (pageNum: number, textIndex: number, textItem: PDFTextItem) => {
    const canvas = canvasInstances.get(pageNum);
    const viewport = pageViewports.get(pageNum);
    if (!canvas || !viewport) return;

    setEditingTextIndex({ pageNum, index: textIndex });

    // Convert PDF.js coordinates to canvas coordinates
    const x = textItem.transform[4];
    const y = textItem.transform[5];
    const textHeight = textItem.height || Math.abs(textItem.transform[3]);
    
    const canvasY = viewport.height - y - textHeight;
    const scaleX = canvas.width! / viewport.width;
    const scaleY = canvas.height! / viewport.height;
    
    const canvasX = x * scaleX;
    const scaledY = canvasY * scaleY;
    const canvasWidth = textItem.width * scaleX;
    const calculatedFontSize = Math.abs(textItem.transform[3]) * scaleY;
    
    // Check if already replaced
    const replacements = textReplacements.get(pageNum) || [];
    const existingReplacement = replacements.find(r => 
      r.originalText === textItem.str && 
      Math.abs(r.originalX - x) < 1
    );
    
    // Apply text formatting
    let fontWeight = textFormat.bold ? 'bold' : 'normal';
    let fontStyle = textFormat.italic ? 'italic' : 'normal';
    let textDecoration = textFormat.underline ? 'underline' : '';
    
    const text = new Textbox(existingReplacement ? existingReplacement.newText : textItem.str, {
      left: canvasX,
      top: scaledY,
      fill: existingReplacement ? existingReplacement.color : color,
      fontSize: existingReplacement ? existingReplacement.fontSize * scaleY : calculatedFontSize,
      fontFamily: existingReplacement ? existingReplacement.fontFamily : selectedFont,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      underline: textFormat.underline,
      textAlign: textFormat.align,
      lineHeight: textFormat.lineHeight,
      width: canvasWidth > 0 ? canvasWidth : 200,
      editable: true,
      selectable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();

    // Show formatting toolbar
    setSelectedTextObject(text);
    const canvasRect = canvas.getElement().getBoundingClientRect();
    setFormatToolbarPosition({
      x: canvasRect.left + canvasX,
      y: canvasRect.top + scaledY,
    });

    setTool("select");
    canvas.defaultCursor = "default";

    text.on('editing:exited', () => {
      const replacement: TextReplacement = {
        originalX: x,
        originalY: y,
        originalText: textItem.str,
        newText: text.text || '',
        fontSize: Math.abs(textItem.transform[3]),
        fontFamily: text.fontFamily || selectedFont,
        color: text.fill as string || color,
        width: textItem.width,
        height: textHeight,
      };
      
      const newReplacements = [...(textReplacements.get(pageNum) || [])];
      const replacementIndex = newReplacements.findIndex(r => 
        r.originalText === textItem.str && 
        Math.abs(r.originalX - x) < 1
      );
      
      if (replacementIndex >= 0) {
        newReplacements[replacementIndex] = replacement;
      } else {
        newReplacements.push(replacement);
      }
      
      setTextReplacements(prev => new Map(prev).set(pageNum, newReplacements));
      setEditingTextIndex(null);
      setFormatToolbarPosition(null);
      setSelectedTextObject(null);
      toast.success("Text updated - will be saved on export");
    });
  };
  
  const applyTextFormat = (format: Partial<typeof textFormat>) => {
    setTextFormat(prev => ({ ...prev, ...format }));
    
    if (selectedTextObject) {
      if (format.bold !== undefined) {
        selectedTextObject.set('fontWeight', format.bold ? 'bold' : 'normal');
      }
      if (format.italic !== undefined) {
        selectedTextObject.set('fontStyle', format.italic ? 'italic' : 'normal');
      }
      if (format.underline !== undefined) {
        selectedTextObject.set('underline', format.underline);
      }
      if (format.align !== undefined) {
        selectedTextObject.set('textAlign', format.align);
      }
      if (format.fontSize !== undefined) {
        selectedTextObject.set('fontSize', format.fontSize);
      }
      if (format.lineHeight !== undefined) {
        selectedTextObject.set('lineHeight', format.lineHeight);
      }
      
      const canvas = canvasInstances.get(currentPage);
      if (canvas) {
        canvas.renderAll();
      }
    }
  };
  
  const handleSearch = (query: string, options: SearchOptions) => {
    const matches: Array<{ pageNum: number; index: number; textItem: PDFTextItem }> = [];
    
    pdfTextItems.forEach((items, pageNum) => {
      items.forEach((textItem, index) => {
        let text = textItem.str;
        let searchQuery = query;
        
        if (!options.caseSensitive) {
          text = text.toLowerCase();
          searchQuery = searchQuery.toLowerCase();
        }
        
        if (options.wholeWord) {
          const regex = new RegExp(`\\b${searchQuery}\\b`);
          if (regex.test(text)) {
            matches.push({ pageNum, index, textItem });
          }
        } else {
          if (text.includes(searchQuery)) {
            matches.push({ pageNum, index, textItem });
          }
        }
      });
    });
    
    setSearchMatches(matches);
    setCurrentSearchIndex(0);
    
    if (matches.length > 0) {
      highlightSearchMatch(matches[0]);
      toast.success(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''}`);
    } else {
      toast.error("No matches found");
    }
  };
  
  const highlightSearchMatch = (match: { pageNum: number; index: number; textItem: PDFTextItem }) => {
    setCurrentPage(match.pageNum);
    
    // Scroll to the page
    setTimeout(() => {
      const pageEl = pageRefs.current.get(match.pageNum);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchMatches.length;
    setCurrentSearchIndex(nextIndex);
    highlightSearchMatch(searchMatches[nextIndex]);
  };
  
  const handlePreviousMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentSearchIndex(prevIndex);
    highlightSearchMatch(searchMatches[prevIndex]);
  };
  
  const handleReplace = (searchQuery: string, replaceText: string, replaceAll: boolean) => {
    if (searchMatches.length === 0) {
      toast.error("No matches to replace");
      return;
    }
    
    if (replaceAll) {
      searchMatches.forEach(match => {
        const replacements = textReplacements.get(match.pageNum) || [];
        const x = match.textItem.transform[4];
        const y = match.textItem.transform[5];
        const textHeight = match.textItem.height || Math.abs(match.textItem.transform[3]);
        
        const replacement: TextReplacement = {
          originalX: x,
          originalY: y,
          originalText: match.textItem.str,
          newText: match.textItem.str.replace(new RegExp(searchQuery, 'g'), replaceText),
          fontSize: Math.abs(match.textItem.transform[3]),
          fontFamily: selectedFont,
          color: color,
          width: match.textItem.width,
          height: textHeight,
        };
        
        const newReplacements = [...replacements];
        const replacementIndex = newReplacements.findIndex(r => 
          r.originalText === match.textItem.str && 
          Math.abs(r.originalX - x) < 1
        );
        
        if (replacementIndex >= 0) {
          newReplacements[replacementIndex] = replacement;
        } else {
          newReplacements.push(replacement);
        }
        
        setTextReplacements(prev => new Map(prev).set(match.pageNum, newReplacements));
      });
      
      toast.success(`Replaced ${searchMatches.length} occurrence${searchMatches.length > 1 ? 's' : ''}`);
      setSearchMatches([]);
    } else {
      const match = searchMatches[currentSearchIndex];
      handleTextClick(match.pageNum, match.index, match.textItem);
      toast.info("Edit the text manually to replace");
    }
  };
  const setupCanvas = (pageNumber: number) => {
    const canvasEl = canvasRefs.current.get(pageNumber);
    const pageEl = pageRefs.current.get(pageNumber);
    if (!canvasEl || !pageEl || canvasInstances.has(pageNumber)) return;
    const rect = pageEl.getBoundingClientRect();
    const canvas = new FabricCanvas(canvasEl, {
      width: rect.width,
      height: rect.height,
      selection: true,
      preserveObjectStacking: true
    });
    
    // Make all objects selectable and movable by default
    canvas.on('object:added', (e) => {
      if (e.target) {
        e.target.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
        });
      }
    });
    
    setCanvasInstances(prev => new Map(prev).set(pageNumber, canvas));
  };
  useEffect(() => {
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) return;

    // Remove all previous event listeners
    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");

    // Reset selection mode
    canvas.selection = true;
    canvas.isDrawingMode = false;

    // Handle signature dragging mode
    if (draggingSignature) {
      canvas.defaultCursor = "none";
      canvas.selection = false;
      
      canvas.on("mouse:move", (e) => {
        if (e.pointer) {
          setSignaturePosition({ x: e.pointer.x, y: e.pointer.y });
        }
      });
      
      canvas.on("mouse:down", async (e) => {
        if (!e.pointer) return;
        
        try {
          const img = await fabric.FabricImage.fromURL(draggingSignature.preview);
          img.scaleToWidth(200);
          img.set({
            left: e.pointer.x - 100,
            top: e.pointer.y - 50,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockMovementX: false,
            lockMovementY: false,
          });
          
          // Add custom delete control
          img.controls = {
            ...img.controls,
            deleteControl: new fabric.Control({
              x: 0.5,
              y: -0.5,
              offsetX: 16,
              offsetY: -16,
              cursorStyle: 'pointer',
              mouseUpHandler: (eventData, transform) => {
                const target = transform.target;
                const canvas = target.canvas;
                canvas?.remove(target);
                canvas?.requestRenderAll();
                toast.success("Signature deleted");
                return true;
              },
              render: (ctx, left, top, styleOverride, fabricObject) => {
                const size = 24;
                ctx.save();
                ctx.translate(left, top);
                ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-6, -6);
                ctx.lineTo(6, 6);
                ctx.moveTo(6, -6);
                ctx.lineTo(-6, 6);
                ctx.stroke();
                ctx.restore();
              }
            })
          };
          
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          toast.success("Signature placed!");
          
          // Reset signature dragging state
          setDraggingSignature(null);
          setSignaturePosition(null);
          setTool("select");
        } catch (error) {
          console.error("Error placing signature:", error);
          toast.error("Failed to place signature");
          setDraggingSignature(null);
          setSignaturePosition(null);
        }
      });
      
      return () => {
        canvas.off("mouse:down");
        canvas.off("mouse:move");
        canvas.off("mouse:up");
      };
    }

    if (tool === "select") {
      // Default selection mode - everything is draggable
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
    }

    if (tool === "text") {
      canvas.defaultCursor = "crosshair";
      canvas.on("mouse:down", e => {
        if (!e.pointer || e.target) return; // Don't add if clicking on existing object
        const text = new Textbox("Double click to edit", {
          left: e.pointer.x,
          top: e.pointer.y,
          fill: color,
          fontSize: parseInt(selectedFontSize),
          fontFamily: selectedFont,
          width: 200,
          editable: true,
          selectable: true,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        canvas.renderAll();
      });
    }

    if (tool === "rect") {
      canvas.defaultCursor = "crosshair";
      let rect: Rect | null = null;
      let isDown = false;
      let origX = 0;
      let origY = 0;
      canvas.on("mouse:down", e => {
        if (!e.pointer || e.target) return; // Don't draw if clicking on existing object
        isDown = true;
        origX = e.pointer.x;
        origY = e.pointer.y;
        rect = new Rect({
          left: origX,
          top: origY,
          fill: "transparent",
          stroke: color,
          strokeWidth: strokeWidth,
          width: 0,
          height: 0,
          selectable: true,
        });
        canvas.add(rect);
      });
      canvas.on("mouse:move", e => {
        if (!isDown || !rect || !e.pointer) return;
        const width = Math.abs(e.pointer.x - origX);
        const height = Math.abs(e.pointer.y - origY);
        rect.set({
          left: Math.min(e.pointer.x, origX),
          top: Math.min(e.pointer.y, origY),
          width,
          height
        });
        canvas.renderAll();
      });
      canvas.on("mouse:up", () => {
        isDown = false;
        if (rect) {
          canvas.setActiveObject(rect);
        }
      });
    }

    if (tool === "circle") {
      canvas.defaultCursor = "crosshair";
      let circle: Circle | null = null;
      let isDown = false;
      let origX = 0;
      let origY = 0;
      canvas.on("mouse:down", e => {
        if (!e.pointer || e.target) return; // Don't draw if clicking on existing object
        isDown = true;
        origX = e.pointer.x;
        origY = e.pointer.y;
        circle = new Circle({
          left: origX,
          top: origY,
          fill: "transparent",
          stroke: color,
          strokeWidth: strokeWidth,
          radius: 0,
          selectable: true,
        });
        canvas.add(circle);
      });
      canvas.on("mouse:move", e => {
        if (!isDown || !circle || !e.pointer) return;
        const radius = Math.sqrt(Math.pow(e.pointer.x - origX, 2) + Math.pow(e.pointer.y - origY, 2));
        circle.set({
          radius
        });
        canvas.renderAll();
      });
      canvas.on("mouse:up", () => {
        isDown = false;
        if (circle) {
          canvas.setActiveObject(circle);
        }
      });
    }

    if (tool === "erase") {
      canvas.defaultCursor = "not-allowed";
      canvas.hoverCursor = "pointer";
      canvas.on("mouse:down", e => {
        if (e.target) {
          canvas.remove(e.target);
          canvas.renderAll();
          toast.success("Object deleted");
        }
      });
    }

    return () => {
      canvas.off("mouse:down");
      canvas.off("mouse:move");
      canvas.off("mouse:up");
    };
  }, [tool, color, strokeWidth, currentPage, canvasInstances, selectedFont, selectedFontSize, draggingSignature]);

  const applyTextFormatting = (command: string) => {
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      const textObj = activeObject as Textbox;
      
      switch (command) {
        case 'bold':
          textObj.set('fontWeight', textObj.fontWeight === 'bold' ? 'normal' : 'bold');
          break;
        case 'italic':
          textObj.set('fontStyle', textObj.fontStyle === 'italic' ? 'normal' : 'italic');
          break;
        case 'underline':
          textObj.set('underline', !textObj.underline);
          break;
        case 'linethrough':
          textObj.set('linethrough', !textObj.linethrough);
          break;
        case 'alignLeft':
          textObj.set('textAlign', 'left');
          break;
        case 'alignCenter':
          textObj.set('textAlign', 'center');
          break;
        case 'alignRight':
          textObj.set('textAlign', 'right');
          break;
      }
      
      canvas.renderAll();
      toast.success("Text formatting applied");
    } else {
      toast.error("Please select a text object first");
    }
  };

  const changeFontFamily = (font: string) => {
    setSelectedFont(font);
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      const textObj = activeObject as Textbox;
      textObj.set('fontFamily', font);
      canvas.renderAll();
      toast.success(`Font changed to ${font}`);
    }
  };

  const changeFontSize = (size: string) => {
    setSelectedFontSize(size);
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      const textObj = activeObject as Textbox;
      textObj.set('fontSize', parseInt(size));
      canvas.renderAll();
      toast.success(`Font size changed to ${size}`);
    }
  };

  const changeTextColor = (newColor: string) => {
    setColor(newColor);
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'textbox') {
      const textObj = activeObject as Textbox;
      textObj.set('fill', newColor);
      canvas.renderAll();
      toast.success("Text color changed");
    }
  };
  const addTextSignature = () => {
    if (!textSignature.trim()) {
      toast.error("Please enter text for signature");
      return;
    }
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    ctx.font = "italic 40px 'Brush Script MT', cursive";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(textSignature, 200, 50);
    const dataUrl = tempCanvas.toDataURL("image/png");
    const newSig: SavedSignature = {
      id: Date.now().toString(),
      type: "text",
      data: textSignature,
      preview: dataUrl
    };
    setSignatures([...signatures, newSig]);
    setTextSignature("");
    toast.success("Signature added!");
  };
  const placeSignature = (signature: SavedSignature) => {
    setDraggingSignature(signature);
    setShowSignaturePanel(false);
    toast.info("Move your cursor to position the signature, then click to place it");
  };
  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
    toast.success("Signature removed!");
  };
  const clearPage = () => {
    const canvas = canvasInstances.get(currentPage);
    if (canvas) {
      canvas.clear();
      toast.success("Page cleared");
    }
  };
  const handleExport = async () => {
    if (!pdfFile || !originalPdfBytes) {
      toast.error("No PDF loaded");
      return;
    }
    try {
      toast.info("Exporting PDF with embedded text edits and annotations...");
      
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Process each page
      for (let i = 1; i <= numPages; i++) {
        const page = pages[i - 1];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Step 1: Handle text replacements (overlaying new text)
        const replacements = textReplacements.get(i) || [];
        const viewport = pageViewports.get(i);
        
        for (const replacement of replacements) {
          if (!viewport) continue;
          
          try {
            // Parse color
            const color = replacement.color;
            const r = parseInt(color.slice(1, 3), 16) / 255;
            const g = parseInt(color.slice(3, 5), 16) / 255;
            const b = parseInt(color.slice(5, 7), 16) / 255;
            
            // Cover original text with white rectangle
            // Note: pdf-lib uses bottom-left origin like PDF.js
            page.drawRectangle({
              x: replacement.originalX,
              y: replacement.originalY,
              width: replacement.width > 0 ? replacement.width : 200,
              height: replacement.height > 0 ? replacement.height : replacement.fontSize,
              color: rgb(1, 1, 1),
            });
            
            // Draw new text at the same position
            page.drawText(replacement.newText, {
              x: replacement.originalX,
              y: replacement.originalY,
              size: replacement.fontSize,
              font: helveticaFont,
              color: rgb(r, g, b),
            });
          } catch (replError) {
            console.error(`Error applying text replacement on page ${i}:`, replError);
          }
        }
        
        // Step 2: Process canvas annotations
        const canvas = canvasInstances.get(i);
        if (canvas) {
          const objects = canvas.getObjects();
          
          for (const obj of objects) {
            try {
              // Convert canvas coordinates to PDF coordinates (PDF has origin at bottom-left)
              const pdfY = pageHeight - (obj.top || 0) - (obj.height || 0) * (obj.scaleY || 1);
              const pdfX = obj.left || 0;
              
              if (obj.type === 'textbox' || obj.type === 'i-text') {
                const textObj = obj as Textbox;
                const text = textObj.text || '';
                const fontSize = (textObj.fontSize || 16) * (textObj.scaleY || 1);
                const color = textObj.fill as string || '#000000';
                
                // Convert hex color to RGB
                const r = parseInt(color.slice(1, 3), 16) / 255;
                const g = parseInt(color.slice(3, 5), 16) / 255;
                const b = parseInt(color.slice(5, 7), 16) / 255;
                
                const font = textObj.fontWeight === 'bold' ? helveticaBold : helveticaFont;
                
                page.drawText(text, {
                  x: pdfX,
                  y: pdfY,
                  size: fontSize,
                  font: font,
                  color: rgb(r, g, b),
                });
              } else if (obj.type === 'rect') {
                const rectObj = obj as Rect;
                const width = (rectObj.width || 0) * (rectObj.scaleX || 1);
                const height = (rectObj.height || 0) * (rectObj.scaleY || 1);
                const strokeColor = rectObj.stroke as string || '#000000';
                const fillColor = rectObj.fill as string;
                
                // Convert hex to RGB
                const parseColor = (hex: string) => {
                  const r = parseInt(hex.slice(1, 3), 16) / 255;
                  const g = parseInt(hex.slice(3, 5), 16) / 255;
                  const b = parseInt(hex.slice(5, 7), 16) / 255;
                  return rgb(r, g, b);
                };
                
                page.drawRectangle({
                  x: pdfX,
                  y: pdfY,
                  width: width,
                  height: height,
                  borderColor: parseColor(strokeColor),
                  borderWidth: rectObj.strokeWidth || 1,
                  color: fillColor && fillColor !== 'transparent' ? parseColor(fillColor) : undefined,
                });
              } else if (obj.type === 'circle') {
                const circleObj = obj as Circle;
                const radius = (circleObj.radius || 0) * (circleObj.scaleX || 1);
                const strokeColor = circleObj.stroke as string || '#000000';
                
                const parseColor = (hex: string) => {
                  const r = parseInt(hex.slice(1, 3), 16) / 255;
                  const g = parseInt(hex.slice(3, 5), 16) / 255;
                  const b = parseInt(hex.slice(5, 7), 16) / 255;
                  return rgb(r, g, b);
                };
                
                page.drawCircle({
                  x: pdfX + radius,
                  y: pdfY + radius,
                  size: radius,
                  borderColor: parseColor(strokeColor),
                  borderWidth: circleObj.strokeWidth || 1,
                });
              } else if (obj.type === 'image') {
                const imgObj = obj as FabricImage;
                const imgElement = imgObj.getElement() as HTMLImageElement | HTMLCanvasElement;
                
                // Convert image to data URL
                let dataUrl: string;
                if (imgElement instanceof HTMLImageElement) {
                  const canvas = document.createElement('canvas');
                  canvas.width = imgElement.naturalWidth || imgElement.width;
                  canvas.height = imgElement.naturalHeight || imgElement.height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(imgElement, 0, 0);
                    dataUrl = canvas.toDataURL('image/png');
                  } else {
                    continue;
                  }
                } else {
                  dataUrl = imgElement.toDataURL('image/png');
                }
                
                // Embed the image
                const imageBytes = dataUrl.split(',')[1];
                const imageBuffer = Uint8Array.from(atob(imageBytes), c => c.charCodeAt(0));
                
                let embeddedImage;
                if (dataUrl.includes('image/png')) {
                  embeddedImage = await pdfDoc.embedPng(imageBuffer);
                } else {
                  embeddedImage = await pdfDoc.embedJpg(imageBuffer);
                }
                
                const width = (imgObj.width || 0) * (imgObj.scaleX || 1);
                const height = (imgObj.height || 0) * (imgObj.scaleY || 1);
                
                page.drawImage(embeddedImage, {
                  x: pdfX,
                  y: pdfY,
                  width: width,
                  height: height,
                });
              }
            } catch (objError) {
              console.error(`Error processing object on page ${i}:`, objError);
              // Continue with next object
            }
          }
        }
      }
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle || 'edited-document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("PDF exported with all text edits and annotations embedded!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) {
      toast.error("Please select a page first");
      return;
    }
    try {
      const img = await FabricImage.fromURL(URL.createObjectURL(file));
      img.scaleToWidth(200);
      img.set({
        left: canvas.width! / 2 - 100,
        top: canvas.height! / 2 - 100,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      toast.success("Image added! Drag to reposition");
      
      // Switch to select tool for immediate dragging
      setTool("select");
    } catch (error) {
      console.error("Error adding image:", error);
      toast.error("Failed to add image");
    }
  };
  const handleBackgroundColor = (color: string) => {
    setBackgroundColor(color);
    const canvas = canvasInstances.get(currentPage);
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.renderAll();
      toast.success("Background color updated");
    }
  };
  const handleExportJPG = async () => {
    if (!pdfFile) {
      toast.error("No PDF loaded");
      return;
    }
    try {
      toast.info("Exporting as JPG...");
      const canvas = canvasInstances.get(currentPage);
      if (!canvas) {
        toast.error("Please select a page first");
        return;
      }
      const dataUrl = canvas.toDataURL({
        format: "jpeg",
        quality: 0.9,
        multiplier: 1
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${projectTitle}-page-${currentPage}.jpg`;
      link.click();
      toast.success("Exported as JPG!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export as JPG");
    }
  };
  const handleShareDocument = async () => {
    if (!pdfFile) {
      toast.error("Please load a PDF first");
      return;
    }

    try {
      const { useSharedPDF } = await import("@/hooks/useSharedPDF");
      const hook = useSharedPDF();
      const result = await hook.createSharedDocument(currentProjectId, projectTitle, pdfFile, 'sign');
      
      if (result) {
        setShareData({
          shareUrl: result.shareUrl,
          shareToken: result.shareToken,
          documentTitle: projectTitle
        });
        setShowShareDialog(true);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share document");
    }
  };

  const handleSendEmailInvitation = async (email: string, message: string, accessLevel: 'view' | 'sign' | 'edit') => {
    if (!shareData) return;
    
    const { useSharedPDF } = await import("@/hooks/useSharedPDF");
    const hook = useSharedPDF();
    const { data: { user } } = await supabase.auth.getUser();
    await hook.sendEmailInvitation(
      shareData.shareToken,
      shareData.documentTitle,
      email,
      user?.user_metadata?.full_name || 'A user',
      message,
      accessLevel
    );
  };

  const oldHandleShareDocument = async () => {
    if (!pdfFile || !currentProjectId) {
      toast.error("Please save the document first");
      return;
    }
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Please sign in to share documents");
        return;
      }
      toast.info("Creating shareable link...");
      const {
        data,
        error
      } = await supabase.from("shared_pdf_documents").insert({
        owner_id: user.id,
        project_id: currentProjectId,
        title: projectTitle,
        pdf_content: {
          pdfUrl: `${user.id}/${Date.now()}_${pdfFile.name}`,
          numPages
        },
        annotations: [],
        signatures: []
      }).select().single();
      if (error) throw error;
      const shareUrl = `${window.location.origin}/shared-pdf/${data.share_token}`;
      setShareData({
        shareUrl,
        shareToken: data.share_token,
        documentTitle: projectTitle
      });
      setShowShareDialog(true);
      toast.success("Shareable link created!");
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error.message || "Failed to create shareable link");
    }
  };
  const copyShareLink = () => {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.shareUrl);
    toast.success("Link copied to clipboard!");
  };
  const handleSaveToAccount = async () => {
    if (!pdfFile) {
      toast.error("No PDF loaded");
      return;
    }
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Please sign in to save PDF");
        return;
      }
      toast.info("Saving PDF...");

      // Upload PDF to storage
      const fileName = `${Date.now()}_${pdfFile.name}`;
      const filePath = `${user.id}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('feed-media').upload(filePath, pdfFile);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      // Save project metadata
      const projectData = {
        pdfUrl: filePath,
        fileName: pdfFile.name,
        numPages,
        currentPage,
        signatures: signatures.map(s => ({
          ...s
        }))
      };
      const result = await saveProject(projectTitle || pdfFile.name, "pdf", projectData, currentProjectId || undefined);
      if (result) {
        setCurrentProjectId(result.id);
      }
      toast.success("PDF saved to MyFiles!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save PDF");
    }
  };
  return (
    <div className="flex flex-col gap-2 sm:gap-4 h-[calc(100vh-8rem)] relative">
      {/* Main PDF Viewer */}
      <div className="flex flex-col gap-2 sm:gap-4 flex-1">
        <div className="hidden md:block">
          <CollapsibleToolbar>
            <div className="flex items-center gap-2 flex-wrap">
            {/* File Upload */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => pdfInputRef.current?.click()}
              title="Upload PDF"
            >
              <Upload className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Font Controls */}
            <Select value={selectedFont} onValueChange={changeFontFamily}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {FONTS.map(font => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFontSize} onValueChange={changeFontSize}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {FONT_SIZES.map(size => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Text Formatting */}
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('bold')} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('italic')} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('underline')} title="Underline">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('linethrough')} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Button>

            {/* Text Alignment */}
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('alignLeft')} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('alignCenter')} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyTextFormatting('alignRight')} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>

            {/* Text Color */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg" style={{ color: color }}>A</span>
              <Input 
                type="color" 
                value={color} 
                onChange={e => changeTextColor(e.target.value)} 
                className="h-8 w-10 p-1 cursor-pointer" 
                title="Text Color"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Drawing Tools */}
            <Button variant={tool === "select" ? "default" : "outline"} size="sm" onClick={() => setTool("select")} title="Select">
              <Type className="h-4 w-4" />
            </Button>
            <Button variant={tool === "text" ? "default" : "outline"} size="sm" onClick={() => setTool("text")} title="Add Text">
              <Type className="h-4 w-4" />
            </Button>
            <Button variant={tool === "rect" ? "default" : "outline"} size="sm" onClick={() => setTool("rect")} title="Rectangle">
              <Square className="h-4 w-4" />
            </Button>
            <Button variant={tool === "circle" ? "default" : "outline"} size="sm" onClick={() => setTool("circle")} title="Circle">
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button variant={tool === "erase" ? "default" : "outline"} size="sm" onClick={() => setTool("erase")} title="Erase">
              <Eraser className="h-4 w-4" />
            </Button>

            {/* Draw/Background Colors */}
            <Input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-10 p-1 cursor-pointer" title="Draw Color" />
            <Input type="color" value={backgroundColor} onChange={e => handleBackgroundColor(e.target.value)} className="h-8 w-10 p-1 cursor-pointer" title="Background Color" />

            <Separator orientation="vertical" className="h-6" />

            {/* Page Actions */}
            <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} title="Add Image">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearPage} title="Clear Page">
              <Trash2 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Search */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSearchDialog(true)} 
              title="Search Text (Ctrl+F)"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Page Navigation */}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} title="Previous Page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm whitespace-nowrap px-1">
              {currentPage}/{numPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages} title="Next Page">
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Zoom Controls */}
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm whitespace-nowrap">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Export & Share */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Export">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem onClick={handleExport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJPG}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Export Page as JPG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleShareDocument} title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            
            {/* Collaboration Presence */}
            {sharedDocumentId && (
              <CollaborationPresence 
                documentId={sharedDocumentId} 
                currentStatus={collaborationStatus}
              />
            )}
          </div>
          </CollapsibleToolbar>
        </div>
        
        {/* Mobile Toolbar */}
        <div className="md:hidden">
          <MobileToolbar 
            groups={[
              {
                label: "File",
                actions: [
                  {
                    icon: Upload,
                    label: "Upload PDF",
                    onClick: () => pdfInputRef.current?.click(),
                    priority: "high"
                  },
                  {
                    icon: Download,
                    label: "Export PDF",
                    onClick: handleExport,
                  },
                  {
                    icon: ImageIcon,
                    label: "Export as JPG",
                    onClick: handleExportJPG,
                  },
                ]
              },
              {
                label: "Tools",
                actions: [
                  {
                    icon: Type,
                    label: "Select",
                    onClick: () => setTool("select"),
                    variant: tool === "select" ? "default" : "outline",
                    priority: "high"
                  },
                  {
                    icon: Type,
                    label: "Add Text",
                    onClick: () => setTool("text"),
                    variant: tool === "text" ? "default" : "outline",
                    priority: "high"
                  },
                  {
                    icon: Square,
                    label: "Rectangle",
                    onClick: () => setTool("rect"),
                    variant: tool === "rect" ? "default" : "outline",
                  },
                  {
                    icon: CircleIcon,
                    label: "Circle",
                    onClick: () => setTool("circle"),
                    variant: tool === "circle" ? "default" : "outline",
                  },
                  {
                    icon: Eraser,
                    label: "Erase",
                    onClick: () => setTool("erase"),
                    variant: tool === "erase" ? "default" : "outline",
                  },
                  {
                    icon: Search,
                    label: "Search",
                    onClick: () => setShowSearchDialog(true),
                    priority: "high"
                  },
                ]
              },
              {
                label: "Page",
                actions: [
                  {
                    icon: ChevronLeft,
                    label: "Previous",
                    onClick: () => setCurrentPage(Math.max(1, currentPage - 1)),
                    disabled: currentPage <= 1,
                    priority: "high"
                  },
                  {
                    icon: ChevronRight,
                    label: "Next",
                    onClick: () => setCurrentPage(Math.min(numPages, currentPage + 1)),
                    disabled: currentPage >= numPages,
                    priority: "high"
                  },
                  {
                    icon: Trash2,
                    label: "Clear Page",
                    onClick: clearPage,
                  },
                  {
                    icon: ImageIcon,
                    label: "Add Image",
                    onClick: () => imageInputRef.current?.click(),
                  },
                ]
              },
              {
                label: "View",
                actions: [
                  {
                    icon: ZoomIn,
                    label: "Zoom In",
                    onClick: () => setZoom(Math.min(2, zoom + 0.1)),
                    priority: "high"
                  },
                  {
                    icon: ZoomOut,
                    label: "Zoom Out",
                    onClick: () => setZoom(Math.max(0.5, zoom - 0.1)),
                    priority: "high"
                  },
                ]
              },
              {
                label: "Share",
                actions: [
                  {
                    icon: Share2,
                    label: "Share",
                    onClick: handleShareDocument,
                  },
                ]
              }
            ]}
            rightActions={[
              {
                icon: FileText,
                label: `${currentPage}/${numPages}`,
                onClick: () => {},
                disabled: true
              }
            ]}
          />
        </div>

        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="flex-1 flex gap-2 sm:gap-4 overflow-hidden min-h-0">
          <Card className="flex-1 overflow-y-auto p-2 sm:p-4 relative">
            {pdfFile ? (
              <div className="pdf-viewer-container p-2 sm:p-4 w-full">{/* Added w-full for proper width constraint */}
                <style>{`
                  .pdf-viewer-container {
                    max-width: 100%;
                    overflow-x: hidden;
                    display: flex;
                    justify-content: center;
                  }
                  .react-pdf__Page {
                    max-width: 100% !important;
                    height: auto !important;
                    margin-bottom: 0 !important;
                  }
                  .react-pdf__Page__canvas {
                    max-width: 100% !important;
                    height: auto !important;
                    display: block;
                  }
                  .react-pdf__Document {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                  }
                `}</style>
                {isLoading && (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading PDF...</p>
                    </div>
                  </div>
                )}
                <div ref={containerRef} className="w-full">
                  <Document 
                    file={pdfFile} 
                    onLoadSuccess={onDocumentLoadSuccess} 
                    onLoadError={onDocumentLoadError} 
                    loading={null}
                  >
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                      <div 
                        key={pageNum} 
                        className="relative border-b border-border last:border-b-0"
                        style={{ maxWidth: '100%' }}
                      >
                        <div ref={el => el && pageRefs.current.set(pageNum, el)} className="relative">
                          <Page 
                            pageNumber={pageNum} 
                            width={Math.min(pageWidth * zoom, containerWidth)} 
                            onLoadSuccess={(page) => {
                              setPageWidth(page.width);
                              setupCanvas(pageNum);
                            }}
                            renderTextLayer={true} 
                            renderAnnotationLayer={false}
                          />
                         
                        {/* Clickable text overlay layer */}
                        <div 
                          ref={el => el && textLayerRefs.current.set(pageNum, el)}
                          className="absolute top-0 left-0 w-full h-full"
                          style={{ zIndex: 3 }}
                        >
                          {pdfTextItems.get(pageNum)?.map((textItem, index) => {
                            const viewport = pageViewports.get(pageNum);
                            if (!viewport) return null;
                            
                            const x = textItem.transform[4];
                            const y = textItem.transform[5];
                            const textHeight = textItem.height || Math.abs(textItem.transform[3]);
                            
                            // Convert to percentage-based positioning
                            const leftPercent = (x / viewport.width) * 100;
                            const topPercent = ((viewport.height - y - textHeight) / viewport.height) * 100;
                            const widthPercent = (textItem.width / viewport.width) * 100;
                            const heightPercent = (textHeight / viewport.height) * 100;
                            
                            const isReplaced = textReplacements.get(pageNum)?.some(r => 
                              r.originalText === textItem.str && 
                              Math.abs(r.originalX - x) < 1
                            );
                            
                            return (
                              <div
                                key={`${pageNum}-${index}`}
                                onClick={() => handleTextClick(pageNum, index, textItem)}
                                className={`absolute cursor-pointer transition-all ${
                                  isReplaced 
                                    ? 'bg-green-200/20 hover:bg-green-400/40' 
                                    : 'hover:bg-blue-400/30'
                                }`}
                                style={{
                                  left: `${leftPercent}%`,
                                  top: `${topPercent}%`,
                                  width: `${widthPercent}%`,
                                  height: `${heightPercent}%`,
                                }}
                                title="Click to edit text"
                              />
                            );
                          })}
                        </div>
                        
                        <canvas 
                          ref={el => el && canvasRefs.current.set(pageNum, el)} 
                          className="absolute top-0 left-0" 
                          style={{
                            width: "100%",
                            height: "100%",
                            zIndex: 2,
                            pointerEvents: tool === "select" || draggingSignature ? "auto" : "none",
                          }} 
                        />
                        
                        {/* Signature preview while dragging */}
                        {draggingSignature && pageNum === currentPage && signaturePosition && (
                          <img 
                            src={draggingSignature.preview}
                            alt="Signature preview"
                            className="absolute pointer-events-none"
                            style={{
                              left: signaturePosition.x - 100,
                              top: signaturePosition.y - 50,
                              width: 200,
                              zIndex: 10,
                              opacity: 0.7,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </Document>
              </div>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText className="h-20 w-20 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No PDF Loaded</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF file to view, annotate, and sign
                </p>
              </div>
            )}
          </Card>

          {/* Activity Panel - Collapsible Sidebar */}
          {sharedDocumentId && (
            <div className="w-80 flex-shrink-0">
              <PDFActivityPanel documentId={sharedDocumentId} />
            </div>
          )}
        </div>
      </div>

      <FloatingActionMenu 
        onSave={handleSaveToAccount} 
        onPrint={handleExport}
        onSignature={() => setShowSignaturePanel(true)}
      />

      {/* Signature Panel */}
      <Sheet open={showSignaturePanel} onOpenChange={setShowSignaturePanel}>
        <SheetContent side="right" className="w-[90vw] sm:w-[400px] md:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Signature Tools</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 mt-6">
            {/* Add Signature */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Add Signature</h3>
              <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as "draw" | "text")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw">
                    <Pencil className="h-4 w-4 mr-1" />
                    Draw
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <Type className="h-4 w-4 mr-1" />
                    Type
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="space-y-3">
                  <canvas
                    ref={signatureCanvasRef}
                    width={300}
                    height={150}
                    className="border rounded cursor-crosshair bg-white w-full"
                    onMouseDown={startDrawingSignature}
                    onMouseMove={drawSignature}
                    onMouseUp={stopDrawingSignature}
                    onMouseLeave={stopDrawingSignature}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={clearSignatureCanvas} variant="outline" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                    <Button size="sm" onClick={stopDrawingSignature} className="flex-1">
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-3">
                  <div>
                    <Label>Signature Text</Label>
                    <Input
                      value={textSignature}
                      onChange={(e) => setTextSignature(e.target.value)}
                      placeholder="Your Name"
                      className="font-signature text-2xl"
                      style={{ fontFamily: "cursive" }}
                    />
                  </div>
                  <Button onClick={addTextSignature} className="w-full">
                    <Check className="h-4 w-4 mr-1" />
                    Add Signature
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Saved Signatures */}
            <Card className="p-4">
              <h3 className="font-medium mb-3">Signatures ({signatures.length})</h3>
              <div className="space-y-2">
                {signatures.map((sig) => (
                  <div 
                    key={sig.id} 
                    className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent"
                    onClick={() => placeSignature(sig)}
                  >
                    {sig.type === "draw" ? (
                      <img src={sig.preview} alt="Signature" className="h-8" />
                    ) : (
                      <span className="text-lg" style={{ fontFamily: "cursive" }}>
                        {sig.data}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSignature(sig.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {signatures.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No signatures yet
                  </p>
                )}
              </div>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        type="pdf"
      />

      {/* Share Dialog */}
      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => setShowShareDialog(false)} 
        shareData={shareData}
        onSendEmail={handleSendEmailInvitation}
      />

      {/* Text Format Toolbar */}
      <TextFormatToolbar
        position={formatToolbarPosition}
        format={textFormat}
        onFormatChange={applyTextFormat}
        onClose={() => {
          setFormatToolbarPosition(null);
          setSelectedTextObject(null);
        }}
      />

      {/* Text Search Dialog */}
      <TextSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSearch={handleSearch}
        onReplace={handleReplace}
        currentMatch={currentSearchIndex}
        totalMatches={searchMatches.length}
        onNextMatch={handleNextMatch}
        onPreviousMatch={handlePreviousMatch}
      />
    </div>
  );
}