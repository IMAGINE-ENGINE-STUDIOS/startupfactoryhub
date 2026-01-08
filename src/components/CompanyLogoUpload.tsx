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
    <div className="flex flex-col items-center space-y-4">
      {/* Logo Preview - Larger and centered */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain p-2" />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <Building className="h-12 w-12 mb-2" />
              <span className="text-xs">No Logo</span>
            </div>
          )}
        </div>
        
        {/* Hover overlay for existing logo */}
        {logoUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-white mb-1" />
                <span className="text-xs text-white">Change</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Upload info and button - below the logo */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP or SVG
          <br />
          Max 5MB
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
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
