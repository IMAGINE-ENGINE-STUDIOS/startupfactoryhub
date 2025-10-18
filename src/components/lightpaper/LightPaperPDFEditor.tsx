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
import { Upload, ZoomIn, ZoomOut, Download, FileText, Pencil, Type, Square, Circle as CircleIcon, Eraser, ChevronLeft, ChevronRight, Save, Trash2, PenTool, Share2, Image as ImageIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Strikethrough } from "lucide-react";
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
  const [tool, setTool] = useState<"select" | "draw" | "text" | "rect" | "circle" | "erase">("select");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedFontSize, setSelectedFontSize] = useState("16");
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [canvasInstances, setCanvasInstances] = useState<Map<number, FabricCanvas>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState("");
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
  useEffect(() => {
    if (signatureCanvasRef.current && isDrawingSignature) {
      const canvas = new FabricCanvas(signatureCanvasRef.current, {
        width: 400,
        height: 200
      });
      canvas.backgroundColor = "#ffffff";
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = "#000000";
      canvas.freeDrawingBrush.width = 2;
      signatureDrawingCanvas.current = canvas;
      return () => {
        canvas.dispose();
        signatureDrawingCanvas.current = null;
      };
    }
  }, [isDrawingSignature]);
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
      height: rect.height
    });
    canvas.isDrawingMode = tool === "draw";
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
    setCanvasInstances(prev => new Map(prev).set(pageNumber, canvas));
  };
  useEffect(() => {
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) return;
    canvas.isDrawingMode = tool === "draw";
    if (tool === "draw" && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
    if (tool === "text") {
      canvas.on("mouse:down", e => {
        if (!e.pointer) return;
        const text = new Textbox("Click to edit", {
          left: e.pointer.x,
          top: e.pointer.y,
          fill: color,
          fontSize: parseInt(selectedFontSize),
          fontFamily: selectedFont
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
      });
    }
    if (tool === "rect") {
      let rect: Rect | null = null;
      let isDown = false;
      let origX = 0;
      let origY = 0;
      canvas.on("mouse:down", e => {
        if (!e.pointer) return;
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
          height: 0
        });
        canvas.add(rect);
      });
      canvas.on("mouse:move", e => {
        if (!isDown || !rect || !e.pointer) return;
        const width = e.pointer.x - origX;
        const height = e.pointer.y - origY;
        rect.set({
          width,
          height
        });
        canvas.renderAll();
      });
      canvas.on("mouse:up", () => {
        isDown = false;
      });
    }
    if (tool === "circle") {
      let circle: Circle | null = null;
      let isDown = false;
      let origX = 0;
      let origY = 0;
      canvas.on("mouse:down", e => {
        if (!e.pointer) return;
        isDown = true;
        origX = e.pointer.x;
        origY = e.pointer.y;
        circle = new Circle({
          left: origX,
          top: origY,
          fill: "transparent",
          stroke: color,
          strokeWidth: strokeWidth,
          radius: 0
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
      });
    }
    if (tool === "erase") {
      canvas.on("mouse:down", e => {
        const target = canvas.findTarget(e.e);
        if (target) {
          canvas.remove(target);
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
  const saveDrawnSignature = () => {
    if (!signatureDrawingCanvas.current) return;
    const dataUrl = signatureDrawingCanvas.current.toDataURL({
      format: "png",
      multiplier: 1
    });
    const newSig: SavedSignature = {
      id: Date.now().toString(),
      type: "draw",
      data: dataUrl,
      preview: dataUrl
    };
    setSignatures([...signatures, newSig]);
    signatureDrawingCanvas.current.clear();
    setIsDrawingSignature(false);
    toast.success("Signature saved!");
  };
  const saveTextSignature = () => {
    if (!signatureText.trim()) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;
    ctx.font = "italic 40px 'Brush Script MT', cursive";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(signatureText, 200, 50);
    const dataUrl = tempCanvas.toDataURL("image/png");
    const newSig: SavedSignature = {
      id: Date.now().toString(),
      type: "text",
      data: signatureText,
      preview: dataUrl
    };
    setSignatures([...signatures, newSig]);
    setSignatureText("");
    toast.success("Signature saved!");
  };
  const placeSignature = async (signature: SavedSignature) => {
    const canvas = canvasInstances.get(currentPage);
    if (!canvas) {
      toast.error("Please select a page first");
      return;
    }
    const img = await fabric.FabricImage.fromURL(signature.preview);
    img.scaleToWidth(200);
    img.set({
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2 - 50
    });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
    toast.success("Signature placed on page " + currentPage);
  };
  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
    toast.success("Signature deleted");
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
        top: canvas.height! / 2 - 100
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      toast.success("Image added to page");
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
  return <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Tools */}
      

      {/* Main Viewer */}
      <div className="flex-1 flex flex-col gap-4">
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
            <Button variant={tool === "draw" ? "default" : "outline"} size="sm" onClick={() => setTool("draw")} title="Draw">
              <Pencil className="h-4 w-4" />
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
                <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={null} className="flex flex-col items-center gap-4">
                  <div className="relative" style={{
                width: pageWidth * zoom
              }}>
                    <div ref={el => el && pageRefs.current.set(currentPage, el)} className="relative">
                      <Page pageNumber={currentPage} width={pageWidth * zoom} onLoadSuccess={() => setupCanvas(currentPage)} renderTextLayer={false} renderAnnotationLayer={false} />
                      <canvas ref={el => el && canvasRefs.current.set(currentPage, el)} className="absolute top-0 left-0 pointer-events-auto" style={{
                    width: "100%",
                    height: "100%"
                  }} />
                    </div>
                  </div>
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