import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { parseDocument, parseDocumentAsImages } from "./AdvancedDocumentParser";
import { Progress } from "@/components/ui/progress";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (content: string, title: string) => void;
}

export function FileUploadDialog({ isOpen, onClose, onFileLoaded }: FileUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("Ready to upload...");
  const [progressValue, setProgressValue] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [uploadMode, setUploadMode] = useState<"view" | "edit" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cancelRef = useRef<boolean>(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation - 5GB limit
    const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5GB');
      return;
    }

    // Extension check (basic validation)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['pdf', 'docx'].includes(fileExtension)) {
      toast.error('Please upload a PDF or DOCX file. Legacy .doc format is not supported.');
      return;
    }

    // Reset states
    setIsUploading(true);
    setIsCancelled(false);
    cancelRef.current = false;
    setUploadProgress("Validating file...");
    setProgressValue(10);

    // Set 120-second timeout for large files
    timeoutRef.current = setTimeout(() => {
      if (!cancelRef.current) {
        cancelRef.current = true;
        setIsUploading(false);
        setUploadProgress("Ready to upload...");
        setProgressValue(0);
        toast.error('Upload timed out. Please try a smaller file.');
      }
    }, 120000);

    try {
      const title = file.name.replace(/\.[^/.]+$/, '');
      
      setProgressValue(20);
      
      // Use appropriate parser based on mode
      let result;
      if (uploadMode === "view") {
        result = await parseDocumentAsImages(file, (message, current, total) => {
          if (cancelRef.current) {
            throw new Error('Upload cancelled by user');
          }
          
          setUploadProgress(message);
          
          if (current && total) {
            const percent = 20 + Math.floor((current / total) * 70);
            setProgressValue(percent);
          }
        });
      } else {
        // Edit mode - use advanced parser with progress callback
        result = await parseDocument(file, (message, current, total) => {
          if (cancelRef.current) {
            throw new Error('Upload cancelled by user');
          }
          
          setUploadProgress(message);
          
          // Calculate progress
          if (current && total) {
            const percent = 20 + Math.floor((current / total) * 70); // 20% to 90%
            setProgressValue(percent);
          }
        });
      }

      if (cancelRef.current) {
        throw new Error('Upload cancelled by user');
      }
      
      setUploadProgress("Loading into editor...");
      setProgressValue(95);
      
      // Pass the content to parent based on mode
      if (uploadMode === "view" && result.images) {
        // View Mode: Pass images as JSON
        onFileLoaded(JSON.stringify({
          mode: 'view',
          images: result.images,
          metadata: result.metadata
        }), title);
      } else {
        // Edit Mode: Pass HTML content
        onFileLoaded(result.html, title);
      }
      
      setProgressValue(100);
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Success notification with metadata
      const fileTypeLabel = result.metadata.fileType.toUpperCase();
      const features = [];
      if (result.metadata.hasEditableText) features.push('editable text');
      if (result.metadata.hasImages) features.push('images');
      if (result.metadata.pageCount) features.push(`${result.metadata.pageCount} pages`);
      
      toast.success(
        `${fileTypeLabel} loaded successfully! ${features.join(', ')}`,
        { duration: 5000 }
      );
      
      setIsUploading(false);
      onClose();

    } catch (error) {
      console.error('[Upload] Error processing document:', error);
      
      if (cancelRef.current) {
        toast.info('Upload cancelled');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
        toast.error(errorMessage, { duration: 6000 });
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsUploading(false);
      setIsCancelled(false);
      setUploadProgress("Ready to upload...");
      setProgressValue(0);
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsCancelled(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsUploading(false);
    setUploadProgress("Ready to upload...");
    setProgressValue(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Choose how to load your document
          </DialogDescription>
        </DialogHeader>

        {!uploadMode ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5"
                onClick={() => setUploadMode("view")}
              >
                <Eye className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">View Mode</p>
                  <p className="text-xs text-muted-foreground">Load as static image</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5"
                onClick={() => setUploadMode("edit")}
              >
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">Edit Mode</p>
                  <p className="text-xs text-muted-foreground">Extract text for editing</p>
                </div>
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Mode Comparison:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>✓ <strong>View Mode:</strong> Perfect for annotations & signatures</li>
                    <li>✓ <strong>Edit Mode:</strong> Full text editing capabilities</li>
                    <li>✓ Process all pages of PDF & DOCX files</li>
                    <li>✓ Up to 5GB file size supported</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Mode:</span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-md flex items-center gap-1">
                {uploadMode === "view" ? <Eye className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                {uploadMode === "view" ? "View Mode" : "Edit Mode"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadMode(null);
                  setUploadProgress("Ready to upload...");
                  setProgressValue(0);
                }}
                className="ml-auto"
              >
                Change Mode
              </Button>
            </div>
            
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-all"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="w-full max-w-xs space-y-2">
                    <p className="text-sm font-medium">{uploadProgress}</p>
                    <Progress value={progressValue} className="h-2" />
                    <p className="text-xs text-muted-foreground">{progressValue}% complete</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF or DOCX files (max 5GB)
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

            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Advanced Features:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>✓ <strong>View Mode:</strong> Load document as static image for viewing/annotation</li>
                    <li>✓ <strong>Edit Mode:</strong> Extract all text for full editing capability</li>
                    <li>✓ <strong>PDF:</strong> All pages processed with images & editable text</li>
                    <li>✓ <strong>DOCX:</strong> Full formatting, images, tables preserved</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1 text-destructive">Important:</p>
                  <p className="text-xs text-muted-foreground">
                    Legacy .doc format not supported. Convert to .docx first.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {isUploading ? (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Upload
                </Button>
              ) : (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
