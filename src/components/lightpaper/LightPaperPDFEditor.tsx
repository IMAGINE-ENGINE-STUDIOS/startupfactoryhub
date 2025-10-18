import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Canvas as FabricCanvas, PencilBrush, IText, Rect, Circle, Textbox, util as fabricUtil } from "fabric";
import * as fabric from "fabric";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  Download,
  FileText,
  Pencil,
  Type,
  Square,
  Circle as CircleIcon,
  Eraser,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { useLightPaperProjects } from "@/hooks/useLightPaperProjects";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface SavedSignature {
  id: string;
  type: "draw" | "text";
  data: string;
  preview: string;
}

export function LightPaperPDFEditor() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageWidth, setPageWidth] = useState(800);
  const [tool, setTool] = useState<"select" | "draw" | "text" | "rect" | "circle" | "erase">("select");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [canvasInstances, setCanvasInstances] = useState<Map<number, FabricCanvas>>(new Map());
  
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureDrawingCanvas = useRef<FabricCanvas | null>(null);

  const { saveProject } = useLightPaperProjects("pdf");

  useEffect(() => {
    if (signatureCanvasRef.current && isDrawingSignature) {
      const canvas = new FabricCanvas(signatureCanvasRef.current, {
        width: 400,
        height: 200,
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
        setPdfFile(file);
        setCurrentPage(1);
        setCanvasInstances(new Map());
        toast.success("PDF loaded successfully!");
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const setupCanvas = (pageNumber: number) => {
    const canvasEl = canvasRefs.current.get(pageNumber);
    const pageEl = pageRefs.current.get(pageNumber);
    
    if (!canvasEl || !pageEl || canvasInstances.has(pageNumber)) return;

    const rect = pageEl.getBoundingClientRect();
    const canvas = new FabricCanvas(canvasEl, {
      width: rect.width,
      height: rect.height,
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
      canvas.on("mouse:down", (e) => {
        if (!e.pointer) return;
        const text = new Textbox("Click to edit", {
          left: e.pointer.x,
          top: e.pointer.y,
          fill: color,
          fontSize: 16,
          fontFamily: "Arial",
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

      canvas.on("mouse:down", (e) => {
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
          height: 0,
        });
        canvas.add(rect);
      });

      canvas.on("mouse:move", (e) => {
        if (!isDown || !rect || !e.pointer) return;
        const width = e.pointer.x - origX;
        const height = e.pointer.y - origY;
        rect.set({ width, height });
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

      canvas.on("mouse:down", (e) => {
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
          radius: 0,
        });
        canvas.add(circle);
      });

      canvas.on("mouse:move", (e) => {
        if (!isDown || !circle || !e.pointer) return;
        const radius = Math.sqrt(
          Math.pow(e.pointer.x - origX, 2) + Math.pow(e.pointer.y - origY, 2)
        );
        circle.set({ radius });
        canvas.renderAll();
      });

      canvas.on("mouse:up", () => {
        isDown = false;
      });
    }

    if (tool === "erase") {
      canvas.on("mouse:down", (e) => {
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
  }, [tool, color, strokeWidth, currentPage, canvasInstances]);

  const saveDrawnSignature = () => {
    if (!signatureDrawingCanvas.current) return;
    
    const dataUrl = signatureDrawingCanvas.current.toDataURL({
      format: "png",
      multiplier: 1,
    });

    const newSig: SavedSignature = {
      id: Date.now().toString(),
      type: "draw",
      data: dataUrl,
      preview: dataUrl,
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
      preview: dataUrl,
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
      top: canvas.height! / 2 - 50,
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
          multiplier: 1,
        });

        const pngImage = await pdfDoc.embedPng(dataUrl);
        const page = pages[i - 1];
        const { width, height } = page.getSize();

        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
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

  const handleSaveToAccount = async () => {
    if (!pdfFile) {
      toast.error("No PDF loaded");
      return;
    }

    const projectData = {
      fileName: pdfFile.name,
      numPages,
      currentPage,
      signatures: signatures.map(s => ({ ...s })),
    };

    await saveProject(pdfFile.name, "pdf", projectData);
    toast.success("Project saved!");
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Tools */}
      <Card className="w-64 p-4 flex flex-col gap-4 overflow-auto">
        <div>
          <Label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm">Upload PDF</span>
            </div>
          </Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Tools</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={tool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("select")}
            >
              Select
            </Button>
            <Button
              variant={tool === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("draw")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("text")}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "rect" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("rect")}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("circle")}
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("erase")}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Color</Label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Stroke Width</Label>
          <Input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Signatures</Label>
          <Tabs defaultValue="library">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-2">
              <ScrollArea className="h-48">
                {signatures.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No signatures yet
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {signatures.map((sig) => (
                      <div
                        key={sig.id}
                        className="border rounded p-2 flex items-center gap-2"
                      >
                        <img
                          src={sig.preview}
                          alt="Signature"
                          className="w-20 h-10 object-contain cursor-pointer"
                          onClick={() => placeSignature(sig)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSignature(sig.id)}
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="create" className="mt-2">
              <div className="flex flex-col gap-3">
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setIsDrawingSignature(!isDrawingSignature)}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Draw Signature
                  </Button>
                  {isDrawingSignature && (
                    <div className="mt-2 border rounded p-2">
                      <canvas
                        ref={signatureCanvasRef}
                        className="border w-full"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={saveDrawnSignature}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => signatureDrawingCanvas.current?.clear()}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Type your name"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="mb-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={saveTextSignature}
                    disabled={!signatureText.trim()}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Create Text Signature
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Main Viewer */}
      <div className="flex-1 flex flex-col gap-4">
        <CollapsibleToolbar>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm whitespace-nowrap">
                Page {currentPage} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm whitespace-nowrap">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={clearPage}>
              Clear Page
            </Button>
          </div>
        </CollapsibleToolbar>

        <Card className="flex-1 overflow-auto">
          {pdfFile ? (
            <div className="p-4">
              <div className="mx-auto" style={{ width: pageWidth * zoom }}>
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative" style={{ width: pageWidth * zoom }}>
                    <div
                      ref={(el) => el && pageRefs.current.set(currentPage, el)}
                      className="relative"
                    >
                      <Page
                        pageNumber={currentPage}
                        width={pageWidth * zoom}
                        onLoadSuccess={() => setupCanvas(currentPage)}
                      />
                      <canvas
                        ref={(el) => el && canvasRefs.current.set(currentPage, el)}
                        className="absolute top-0 left-0 pointer-events-auto"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  </div>
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
      </div>

      <FloatingActionMenu
        onSave={handleSaveToAccount}
        onPrint={handleExport}
      />
    </div>
  );
}
