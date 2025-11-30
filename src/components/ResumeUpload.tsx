import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Download, Trash2, Loader2 } from 'lucide-react';

interface ResumeUploadProps {
  currentResumeUrl?: string | null;
  onUploadComplete?: (url: string | null) => void;
  showInline?: boolean;
  className?: string;
}

export default function ResumeUpload({ 
  currentResumeUrl, 
  onUploadComplete,
  showInline = false,
  className = ''
}: ResumeUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(currentResumeUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, DOC, or DOCX file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Delete old resume if exists
      if (resumeUrl) {
        const oldPath = resumeUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('public-resumes').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `resume_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload new resume
      const { error: uploadError } = await supabase.storage
        .from('public-resumes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-resumes')
        .getPublicUrl(filePath);

      // Update profile with resume URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setResumeUrl(publicUrl);
      onUploadComplete?.(publicUrl);

      toast({
        title: 'Resume uploaded',
        description: 'Your resume has been uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!user || !resumeUrl) return;

    setDeleting(true);
    try {
      // Extract file path from URL
      const urlParts = resumeUrl.split('/public-resumes/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('public-resumes').remove([filePath]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ resume_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setResumeUrl(null);
      onUploadComplete?.(null);

      toast({
        title: 'Resume deleted',
        description: 'Your resume has been removed',
      });
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete resume',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1] || 'resume';
    } catch {
      return 'resume';
    }
  };

  if (showInline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {resumeUrl ? (
          <>
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm truncate max-w-[150px]">{getFileName(resumeUrl)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => window.open(resumeUrl, '_blank')}
            >
              <Download className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No resume</span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {resumeUrl ? (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm truncate max-w-[200px]">
                {getFileName(resumeUrl)}
              </p>
              <p className="text-xs text-muted-foreground">
                Resume uploaded
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(resumeUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Upload your resume (PDF, DOC, DOCX)
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Max file size: 10MB
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={resumeUrl ? "outline" : "default"}
          className="flex-1"
          disabled={uploading}
          asChild
        >
          <label className="cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {resumeUrl ? 'Replace Resume' : 'Upload Resume'}
              </>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
