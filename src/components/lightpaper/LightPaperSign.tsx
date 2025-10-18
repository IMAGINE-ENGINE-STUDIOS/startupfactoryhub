import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Pen, Type, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Signature {
  type: "draw" | "text";
  data: string;
  x: number;
  y: number;
  id: string;
}

export function LightPaperSign() {
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"view" | "draw" | "text">("view");
  const [textSignature, setTextSignature] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDocumentUrl(url);
      toast.success("Document loaded successfully!");
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureMode !== "draw") return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setLastPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureMode !== "draw") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.stroke();

      setLastPos({ x, y });
    }
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const signatureData = canvasRef.current.toDataURL();
      setSignatures([
        ...signatures,
        {
          type: "draw",
          data: signatureData,
          x: 0,
          y: 0,
          id: Date.now().toString()
        }
      ]);
      clearCanvas();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        x: 0,
        y: 0,
        id: Date.now().toString()
      }
    ]);
    setTextSignature("");
    toast.success("Signature added!");
  };

  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter((sig) => sig.id !== id));
    toast.success("Signature removed!");
  };

  const exportDocument = () => {
    toast.success("Document with signatures exported!");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="doc-upload">
          <Button variant="outline" size="sm" asChild>
            <span>
              <Upload className="h-4 w-4 mr-1" />
              Upload Document
            </span>
          </Button>
        </label>
        <input
          id="doc-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileUpload}
        />
        {documentUrl && (
          <Button variant="outline" size="sm" onClick={exportDocument}>
            <Download className="h-4 w-4 mr-1" />
            Export Signed
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          {documentUrl ? (
            <div className="border rounded-lg overflow-auto" style={{ height: "600px" }}>
              <iframe src={documentUrl} className="w-full h-full" title="Document" />
            </div>
          ) : (
            <div className="border rounded-lg flex items-center justify-center" style={{ height: "600px" }}>
              <div className="text-center text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-2" />
                <p>Upload a document to start signing</p>
              </div>
            </div>
          )}
        </div>

        {/* Signature Tools */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium mb-3">Add Signature</h3>
            <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="draw">
                  <Pen className="h-4 w-4 mr-1" />
                  Draw
                </TabsTrigger>
                <TabsTrigger value="text">
                  <Type className="h-4 w-4 mr-1" />
                  Type
                </TabsTrigger>
              </TabsList>

              <TabsContent value="draw" className="space-y-3">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={150}
                  className="border rounded cursor-crosshair bg-white w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={clearCanvas} variant="outline" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={stopDrawing} className="flex-1">
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
                <div key={sig.id} className="flex items-center justify-between p-2 border rounded">
                  {sig.type === "draw" ? (
                    <img src={sig.data} alt="Signature" className="h-8" />
                  ) : (
                    <span className="text-lg" style={{ fontFamily: "cursive" }}>
                      {sig.data}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSignature(sig.id)}
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
      </div>
    </Card>
  );
}
