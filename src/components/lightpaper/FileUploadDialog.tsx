import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (content: string, title: string) => void;
}

export function FileUploadDialog({ isOpen, onClose, onFileLoaded }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('FileUploadDialog rendered, isOpen:', isOpen);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect called');
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name, file?.type, file?.size);
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.google-apps.document', // Google Docs
    ];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'doc', 'docx'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      toast.error('Please upload a PDF, Word document, or Google Doc file');
      return;
    }

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setIsUploading(true);

    try {
      // Save file to temporary location
      const formData = new FormData();
      formData.append('file', file);

      // Create a temporary file path
      const tempPath = `user-uploads://${file.name}`;
      
      // For now, we'll use FileReader to read the file content
      // In a real implementation, you would use the document parser
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          console.log('Starting to parse document:', file.name);
          const content = await parseDocument(file, arrayBuffer);
          console.log('Parsed content length:', content.length);
          console.log('Content preview:', content.substring(0, 200));
          
          onFileLoaded(content, file.name.replace(/\.[^/.]+$/, ''));
          toast.success(`Successfully loaded ${file.name}`);
          setIsUploading(false);
          onClose();
        } catch (error) {
          console.error('Error parsing document:', error);
          toast.error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Error reading file');
        setIsUploading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      setIsUploading(false);
    }
  };

  const parseDocument = async (file: File, arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // Parse PDF files
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += `<h2>Page ${i}</h2><p>${pageText}</p>`;
        }
        
        return fullText || '<p>PDF loaded but no text content found.</p>';
      }
      
      // Parse Word documents (.docx)
      if (file.name.endsWith('.docx')) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        return result.value || '<p>Word document loaded but no content found.</p>';
      }
      
      // For .doc files (older format), mammoth can still try
      if (file.name.endsWith('.doc')) {
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          return result.value || '<p>Word document loaded but no content found.</p>';
        } catch (err) {
          return '<p>Unable to parse .doc file. Please save as .docx and try again.</p>';
        }
      }
      
      return '<p>Document loaded successfully.</p>';
    } catch (error) {
      console.error('Error parsing document:', error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, Word document, or Google Doc to edit
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading and parsing...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX (max 20MB)
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Supported formats:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• PDF files (can be edited)</li>
                <li>• Word documents (.doc, .docx)</li>
                <li>• Google Docs (exported format)</li>
              </ul>
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
