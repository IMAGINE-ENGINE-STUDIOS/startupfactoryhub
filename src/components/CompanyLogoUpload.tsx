import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Building } from 'lucide-react';

interface CompanyLogoUploadProps {
  currentLogoUrl?: string | null;
  companyId?: string;
  onUploadComplete?: (url: string) => void;
}

export default function CompanyLogoUpload({ 
  currentLogoUrl, 
  companyId,
  onUploadComplete 
}: CompanyLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setLogoUrl(currentLogoUrl || null);
  }, [currentLogoUrl]);

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      
      // Validate file size (5MB)
      if (file.size > 5242880) {
        toast({
          title: "File too large",
          description: "Logo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, WEBP, or SVG image",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update company with new logo URL
      if (companyId) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({ logo_url: publicUrl })
          .eq('id', companyId);

        if (updateError) throw updateError;
      } else {
        // If no company ID, update the user's company
        const { error: updateError } = await supabase
          .from('companies')
          .update({ logo_url: publicUrl })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      setLogoUrl(publicUrl);
      onUploadComplete?.(publicUrl);

      toast({
        title: "Logo updated!",
        description: "Your company logo has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-accent/5 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <Building className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          
          {logoUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-white" />
              )}
            </button>
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-medium mb-1">Company Logo</h4>
          <p className="text-xs text-muted-foreground mb-3">
            PNG, JPG, WEBP or SVG (max 5MB)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </>
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={uploadLogo}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}
