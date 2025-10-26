import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { renderAsync } from "docx-preview";
import * as pdfjsLib from "pdfjs-dist";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (content: string, title: string) => void;
}

export function FileUploadDialog({ isOpen, onClose, onFileLoaded }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("Preparing...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processDOCX = async (file: File): Promise<string> => {
    // Create temporary container for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);

    try {
      // Render DOCX with full formatting preservation
      await renderAsync(file, container, undefined, {
        className: 'docx-content',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        useBase64URL: true, // Embed images as base64
        debug: false,
      });

      // Extract rendered HTML
      const html = container.innerHTML;
      
      // Clean up
      document.body.removeChild(container);
      
      return html;
    } catch (error) {
      document.body.removeChild(container);
      throw error;
    }
  };

  const processPDF = async (file: File): Promise<string> => {
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let html = '<div class="pdf-document" style="max-width: 100%;">';
    
    // Render each page as high-resolution image
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      setUploadProgress(`Rendering page ${pageNum} of ${pdf.numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x for high quality
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ 
        canvasContext: context,
        viewport,
        canvas
      }).promise;
      
      const imageData = canvas.toDataURL('image/png');
      html += `<div style="margin: 1rem 0; page-break-after: always;">
        <img src="${imageData}" style="max-width: 100%; height: auto; display: block;" alt="Page ${pageNum}" />
      </div>`;
    }
    
    html += '</div>';
    return html;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    const validExtensions = ['pdf', 'docx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      toast.error('Please upload a PDF or modern Word document (.pdf, .docx). Legacy .doc format is not supported.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress("Processing document...");

    try {
      let content: string;
      const title = file.name.replace(/\.[^/.]+$/, '');

      // Process based on file type - all client-side, no APIs
      if (fileExtension === 'docx') {
        setUploadProgress("Rendering Word document...");
        content = await processDOCX(file);
        toast.success(`Successfully loaded ${file.name} with full formatting!`);
      } else if (fileExtension === 'pdf') {
        setUploadProgress("Converting PDF pages...");
        content = await processPDF(file);
        toast.success(`Successfully loaded ${file.name} as images!`);
      } else {
        throw new Error('Unsupported file type');
      }

      setUploadProgress("Loading into editor...");
      onFileLoaded(content, title);
      
      setIsUploading(false);
      onClose();

    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process document');
      setIsUploading(false);
      setUploadProgress("Preparing...");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF or Word document to edit in LightPaper
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">{uploadProgress}</p>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX (max 20MB)
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ PDF files (.pdf)</li>
                <li>✓ Modern Word documents (.docx)</li>
              </ul>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <strong>Note:</strong> Legacy .doc format is not supported. Please convert to .docx first using Microsoft Word.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
