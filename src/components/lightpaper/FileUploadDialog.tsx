import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (content: string, title: string) => void;
}

export function FileUploadDialog({ isOpen, onClose, onFileLoaded }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("Preparing...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    const validExtensions = ['pdf', 'doc', 'docx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      toast.error('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading file...");

    try {
      // Step 1: Upload to temp storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temp-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('File uploaded to storage:', fileName);
      setUploadProgress("Parsing document...");

      // Step 2: Call edge function to parse
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
        body: { filePath: fileName }
      });

      if (parseError) {
        throw new Error(`Parsing failed: ${parseError.message}`);
      }

      if (!parseData.success) {
        throw new Error(parseData.error || 'Failed to parse document');
      }

      console.log('Document parsed successfully');
      setUploadProgress("Loading into editor...");

      // Step 3: Load into editor
      const title = file.name.replace(/\.[^/.]+$/, '');
      onFileLoaded(parseData.content, title);
      
      toast.success(`Successfully loaded ${file.name}`);
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
                <li>✓ PDF files with text extraction</li>
                <li>✓ Word documents (.docx, .doc)</li>
                <li>✓ Fully editable after upload</li>
              </ul>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <strong>Note:</strong> .docx files work best. Legacy .doc files may have limited parsing quality.
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
