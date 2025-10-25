import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page, pdfjs } from "react-pdf";
import { Canvas as FabricCanvas, FabricImage, PencilBrush, Text as FabricText } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PenTool, Type, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from "lucide-react";
import { useSharedPDF } from "@/hooks/useSharedPDF";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SharedPDFView() {
  const { token } = useParams<{ token: string }>();
  const { document: pdfDocument, loading, signatures, loadSharedDocument, addSignature } = useSharedPDF(token);
  
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "text">("draw");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [textSignature, setTextSignature] = useState("");
  
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvas = useRef<FabricCanvas | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      loadSharedDocument(token);
    }
  }, [token]);

  useEffect(() => {
    if (pdfDocument) {
      loadPDFFile();
    }
  }, [pdfDocument]);

  // Initialize signature canvas
  useEffect(() => {
    if (!showSignDialog || signatureMode !== "draw") {
      // Clean up if switching away from draw mode
      if (signatureCanvas.current) {
        signatureCanvas.current.dispose();
        signatureCanvas.current = null;
      }
      return;
    }

    // Wait for canvas element to be in DOM
    const initCanvas = () => {
      if (!signCanvasRef.current) {
        setTimeout(initCanvas, 50);
        return;
      }

      if (signatureCanvas.current) {
        signatureCanvas.current.dispose();
      }

      const canvas = new FabricCanvas(signCanvasRef.current, {
        width: 500,
        height: 200,
        backgroundColor: "#ffffff",
      });

      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = "#000000";
      canvas.freeDrawingBrush.width = 2;
      
      signatureCanvas.current = canvas;
    };

    initCanvas();

    return () => {
      if (signatureCanvas.current) {
        signatureCanvas.current.dispose();
        signatureCanvas.current = null;
      }
    };
  }, [showSignDialog, signatureMode]);

  const loadPDFFile = async () => {
    if (!pdfDocument || !pdfDocument.storage_path) return;

    try {
      const { data: fileData } = await supabase.storage
        .from("pdf-documents")
        .download(pdfDocument.storage_path);

      if (fileData) {
        setPdfBlob(fileData);
      }
    } catch (error: any) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF file");
    }
  };

  const setupCanvas = () => {
    if (!pageRef.current) {
      console.error("Page ref not ready");
      return;
    }

    // Wait for PDF page to fully render
    setTimeout(() => {
      if (!pageRef.current) return;
      
      // Remove old canvas if exists
      const oldCanvas = pageRef.current.querySelector('canvas.signature-overlay');
      if (oldCanvas) oldCanvas.remove();

      const canvasEl = document.createElement("canvas");
      canvasEl.className = "signature-overlay";
      canvasEl.style.position = "absolute";
      canvasEl.style.top = "0";
      canvasEl.style.left = "0";
      canvasEl.style.pointerEvents = "none";
      
      pageRef.current.appendChild(canvasEl);

      const rect = pageRef.current.getBoundingClientRect();
      const fabricCanvas = new FabricCanvas(canvasEl, {
        width: rect.width,
        height: rect.height,
      });

      setCanvas(fabricCanvas);
      loadSignaturesOnCanvas(fabricCanvas);
    }, 100); // Small delay to ensure page is rendered
  };

  const loadSignaturesOnCanvas = async (fabricCanvas: FabricCanvas) => {
    if (!signatures || signatures.length === 0) return;

    for (const sig of signatures) {
      if (sig.page_number === currentPage) {
        try {
          // Handle both drawn and text signatures
          if (sig.signature_type === 'text') {
            // For text signatures, create a text object
            const textObj = new FabricText(sig.signature_data, {
              left: sig.position.x || 100,
              top: sig.position.y || 100,
              fontSize: 40,
              fontFamily: 'Brush Script MT, cursive',
              fontStyle: 'italic',
              fill: '#000000',
              selectable: false,
            });
            fabricCanvas.add(textObj);
          } else {
            // For drawn signatures, load as image
            const img = await FabricImage.fromURL(sig.signature_data);
            img.scaleToWidth(150);
            img.set({
              left: sig.position.x || 100,
              top: sig.position.y || 100,
              selectable: false,
            });
            fabricCanvas.add(img);
          }
        } catch (error) {
          console.error("Error loading signature:", error);
        }
      }
    }
    fabricCanvas.renderAll();
  };

  const saveDrawnSignature = async () => {
    if (!signatureCanvas.current || !pdfDocument) return;

    if (!signerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const dataUrl = signatureCanvas.current.toDataURL({
      format: "png",
      multiplier: 1,
    });

    const success = await addSignature(
      pdfDocument.id,
      signerName,
      signerEmail || null,
      dataUrl,
      "draw",
      { x: 100, y: 100 },
      currentPage
    );

    if (success) {
      toast.success(`Signature added successfully! ${signatures.length + 1} total signatures`);
      setShowSignDialog(false);
      signatureCanvas.current.clear();
      setSignerName("");
      setSignerEmail("");
    }
  };

  const saveTextSignature = async () => {
    if (!textSignature.trim()) {
      toast.error("Please enter your signature");
      return;
    }

    if (!signerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!pdfDocument) return;

    // Create canvas for text signature
    const tempCanvas = window.document.createElement("canvas");
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

    const success = await addSignature(
      pdfDocument.id,
      signerName,
      signerEmail || null,
      dataUrl,
      "text",
      { x: 100, y: 100 },
      currentPage
    );

    if (success) {
      toast.success(`Signature added successfully! ${signatures.length + 1} total signatures`);
      setShowSignDialog(false);
      setTextSignature("");
      setSignerName("");
      setSignerEmail("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (!pdfDocument) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
          <p className="text-muted-foreground">This document may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{pdfDocument.title}</h1>
              <p className="text-sm text-muted-foreground">
                {pdfDocument.access_level === 'view' && 'View Only'}
                {pdfDocument.access_level === 'sign' && `${signatures.length} signature(s)`}
                {pdfDocument.access_level === 'edit' && 'Collaborative Editing'}
              </p>
            </div>
            {pdfDocument.access_level !== 'view' && (
              <Button onClick={() => setShowSignDialog(true)}>
                Sign Document
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
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
              <span className="text-sm">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {pdfBlob ? (
            <div className="flex justify-center">
              <Document
                file={pdfBlob}
                onLoadSuccess={(pdf) => {
                  setNumPages(pdf.numPages);
                  toast.success(`PDF loaded with ${pdf.numPages} pages`);
                  // Setup canvas after page is rendered
                  setupCanvas();
                }}
                onLoadError={(error) => {
                  console.error("PDF load error:", error);
                  toast.error("Failed to load PDF");
                }}
                loading={null}
              >
                <div ref={pageRef} style={{ position: "relative" }}>
                  <Page
                    pageNumber={currentPage}
                    width={800 * zoom}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              </Document>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <FileText className="h-20 w-20 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Loading PDF...</h3>
              <p className="text-sm text-muted-foreground">Please wait while the document loads</p>
            </div>
          )}
        </Card>

        <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sign Document</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as "draw" | "text")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw">Draw Signature</TabsTrigger>
                  <TabsTrigger value="text">Type Signature</TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="space-y-4">
                  <div className="border rounded p-4">
                    <canvas
                      ref={signCanvasRef}
                      className="border w-full cursor-crosshair bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveDrawnSignature} className="flex-1">
                      <PenTool className="h-4 w-4 mr-2" />
                      Save & Add Signature
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => signatureCanvas.current?.clear()}
                    >
                      Clear
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <div className="border rounded p-4 bg-white">
                    <Input
                      value={textSignature}
                      onChange={(e) => setTextSignature(e.target.value)}
                      placeholder="Type your signature"
                      className="text-3xl font-serif italic text-center border-0 focus-visible:ring-0"
                    />
                  </div>
                  <Button onClick={saveTextSignature} className="w-full">
                    <Type className="h-4 w-4 mr-2" />
                    Save & Add Signature
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
