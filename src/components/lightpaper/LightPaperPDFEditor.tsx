import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Canvas as FabricCanvas, PencilBrush, IText, Rect, Circle, Textbox, util as fabricUtil, FabricImage } from "fabric";
import * as fabric from "fabric";
import { PDFDocument } from "pdf-lib";
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
import { Upload, ZoomIn, ZoomOut, Download, FileText, Pencil, Type, Square, Circle as CircleIcon, Eraser, ChevronLeft, ChevronRight, Save, Trash2, Share2, Image as ImageIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Strikethrough, Check, Pen } from "lucide-react";
import { toast } from "sonner";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import { supabase } from "@/integrations/supabase/client";

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
  const [shareLink, setShareLink] = useState("");
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureDrawingCanvas = useRef<FabricCanvas | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("Untitled PDF");
  const {
    saveProject
  } = useLightPaperProjects("pdf");

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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setIsLoading(true);
        setPdfFile(file);
        setCurrentPage(1);
        setCanvasInstances(new Map());
        toast.success("PDF loaded successfully!");
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };
  const onDocumentLoadSuccess = ({
    numPages
  }: {
    numPages: number;
  }) => {
    setNumPages(numPages);
    setIsLoading(false);
    toast.success(`PDF loaded with ${numPages} pages`);
  };
  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setIsLoading(false);
    toast.error(`Failed to load PDF: ${error.message}`);
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
  }, [tool, color, strokeWidth, currentPage, canvasInstances, selectedFont, selectedFontSize]);

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
  const placeSignature = async (signature: SavedSignature) => {
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) {
      toast.error("Please select a page first");
      return;
    }
    
    try {
      const img = await fabric.FabricImage.fromURL(signature.preview);
      img.scaleToWidth(200);
      img.set({
        left: canvas.width! / 2 - 100,
        top: canvas.height! / 2 - 50,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      toast.success("Signature placed! Drag to reposition");
      
      // Switch to select tool for immediate dragging
      setTool("select");
    } catch (error) {
      console.error("Error placing signature:", error);
      toast.error("Failed to place signature");
    }
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
    if (!pdfFile) {
      toast.error("No PDF loaded");
      return;
    }
    try {
      toast.info("Exporting PDF with annotations...");
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      for (let i = 1; i <= numPages; i++) {
        const canvas = canvasInstances.get(i);
        if (!canvas) continue;
        const objects = canvas.getObjects();
        if (objects.length === 0) continue;
        const dataUrl = canvas.toDataURL({
          format: "png",
          multiplier: 1
        });
        const pngImage = await pdfDoc.embedPng(dataUrl);
        const page = pages[i - 1];
        const {
          width,
          height
        } = page.getSize();
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height
        });
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "signed-document.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported successfully!");
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
      setShareLink(shareUrl);
      setShowShareDialog(true);
      toast.success("Shareable link created!");
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error.message || "Failed to create shareable link");
    }
  };
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
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
  return <div className="flex flex-col gap-4 h-[calc(100vh-200px)] relative">
      {/* Main PDF Viewer */}
      <div className="flex flex-col gap-4 flex-1">
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
          </div>
        </CollapsibleToolbar>

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

        <Card className="flex-1 overflow-auto">
          {pdfFile ? <div className="p-4">
              {isLoading && <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>}
              <div className="mx-auto" style={{
            width: pageWidth * zoom
          }}>
                <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={null} className="flex flex-col items-center gap-6">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <div key={pageNum} className="relative flex flex-col items-center gap-2" style={{
                      width: pageWidth * zoom
                    }}>
                      <div ref={el => el && pageRefs.current.set(pageNum, el)} className="relative shadow-lg">
                        <Page 
                          pageNumber={pageNum} 
                          width={pageWidth * zoom} 
                          onLoadSuccess={() => setupCanvas(pageNum)} 
                          renderTextLayer={false} 
                          renderAnnotationLayer={false}
                          className="pointer-events-none"
                        />
                        <canvas 
                          ref={el => el && canvasRefs.current.set(pageNum, el)} 
                          className="absolute top-0 left-0 pointer-events-auto cursor-default" 
                          style={{
                            width: "100%",
                            height: "100%",
                            touchAction: "none"
                          }} 
                        />
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Page {pageNum} of {numPages}
                      </div>
                    </div>
                  ))}
                </Document>
              </div>
            </div> : <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FileText className="h-20 w-20 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No PDF Loaded</h3>
              <p className="text-sm text-muted-foreground">
                Upload a PDF file to view, annotate, and sign
              </p>
            </div>}
        </Card>
      </div>

      <FloatingActionMenu onSave={handleSaveToAccount} onPrint={handleExport} />

      {/* Floating Signature Button */}
      <Sheet open={showSignaturePanel} onOpenChange={setShowSignaturePanel}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            size="icon"
          >
            <Pen className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share PDF Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Shareable Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button onClick={copyShareLink} size="sm">
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Anyone with this link can view and sign the document
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}