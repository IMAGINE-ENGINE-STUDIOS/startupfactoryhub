import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, ZoomIn, ZoomOut, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export function LightPaperPDF() {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        toast.success("PDF loaded successfully!");
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const handleUrlLoad = () => {
    const url = prompt("Enter PDF URL:");
    if (url) {
      setPdfUrl(url);
      toast.success("PDF loaded from URL!");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <label htmlFor="pdf-upload">
          <Button variant="outline" size="sm" asChild>
            <span>
              <Upload className="h-4 w-4 mr-1" />
              Upload PDF
            </span>
          </Button>
        </label>
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button variant="outline" size="sm" onClick={handleUrlLoad}>
          <FileText className="h-4 w-4 mr-1" />
          Load from URL
        </Button>
        {pdfUrl && (
          <>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-16 text-center">{zoom}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {pdfUrl ? (
        <div className="border rounded-lg overflow-auto" style={{ height: "calc(100vh - 300px)" }}>
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
            title="PDF Viewer"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-20 w-20 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No PDF Loaded</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a PDF file or load from URL to get started
          </p>
        </div>
      )}
    </Card>
  );
}
