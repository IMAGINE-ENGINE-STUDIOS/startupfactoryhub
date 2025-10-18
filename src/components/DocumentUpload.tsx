import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, FileText, Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Document {
  name: string;
  url: string;
  size: number;
  uploaded_at: string;
}

interface DocumentUploadProps {
  documents?: Document[];
  onUploadComplete?: (documents: Document[]) => void;
  maxFiles?: number;
}

export default function DocumentUpload({ 
  documents = [],
  onUploadComplete,
  maxFiles = 5
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [userDocuments, setUserDocuments] = useState<Document[]>(documents);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      if (userDocuments.length >= maxFiles) {
        toast({
          title: "Upload limit reached",
          description: `You can only upload up to ${maxFiles} documents`,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      
      // Validate file size (10MB)
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: "Document must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${timestamp}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get signed URL for private documents (valid for 1 year)
      const { data: signedData, error: signError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 365 * 24 * 60 * 60); // 1 year in seconds

      if (signError) throw signError;

      const newDocument: Document = {
        name: file.name,
        url: signedData.signedUrl,
        size: file.size,
        uploaded_at: new Date().toISOString()
      };

      const updatedDocs = [...userDocuments, newDocument];
      setUserDocuments(updatedDocs);
      onUploadComplete?.(updatedDocs);

      toast({
        title: "Document uploaded!",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (doc: Document) => {
    try {
      if (!user) throw new Error('Not authenticated');

      // Extract file path from URL (works with both public and signed URLs)
      const urlParts = doc.url.split('/documents/');
      if (urlParts.length < 2) throw new Error('Invalid document URL');
      
      // Remove query parameters if present (from signed URLs)
      const pathWithParams = urlParts[1];
      const filePath = pathWithParams.split('?')[0];

      const { error } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (error) throw error;

      const updatedDocs = userDocuments.filter(d => d.url !== doc.url);
      setUserDocuments(updatedDocs);
      onUploadComplete?.(updatedDocs);

      toast({
        title: "Document deleted",
        description: `${doc.name} has been removed.`,
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Documents</h4>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT (max 10MB each, {maxFiles} files max)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || userDocuments.length >= maxFiles}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={uploadDocument}
        disabled={uploading}
        className="hidden"
      />

      {userDocuments.length > 0 && (
        <div className="space-y-2">
          {userDocuments.map((doc, index) => (
            <Card key={index} className="border border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDocument(doc)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {userDocuments.length === 0 && (
        <Card className="border-2 border-dashed border-border">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground mb-2">No documents uploaded yet</p>
            <p className="text-xs text-muted-foreground">
              Upload pitch decks, business plans, or other documents
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
