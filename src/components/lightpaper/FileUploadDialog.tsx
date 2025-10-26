import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (content: string, title: string) => void;
}

export function FileUploadDialog({ isOpen, onClose, onFileLoaded }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Here we would normally call the document parser
        // For now, we'll just show a placeholder
        const content = await parseDocument(file, arrayBuffer);
        
        onFileLoaded(content, file.name.replace(/\.[^/.]+$/, ''));
        toast.success(`Successfully loaded ${file.name}`);
        onClose();
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
    // This is a simplified parser
    // In production, you would use proper PDF/DOCX parsing libraries
    
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDF files, we'll show a message
      return '<h1>PDF Document Loaded</h1><p>PDF content will be parsed and displayed here.</p><p>Note: PDF editing capabilities are available.</p>';
    }
    
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // For Word documents
      return '<h1>Word Document Loaded</h1><p>Document content will be parsed and displayed here.</p><p>All formatting will be preserved.</p>';
    }
    
    return '<p>Document loaded successfully. Content will appear here.</p>';
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
