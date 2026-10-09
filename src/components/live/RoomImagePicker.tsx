import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

/** Uploads a room/district cover image to the public feed-media bucket and returns its URL. */
export async function uploadRoomImage(file: File, userId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '');
  const path = `${userId}/rooms/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('feed-media').upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('feed-media').getPublicUrl(path).data.publicUrl;
}

interface Props {
  file: File | null;
  onChange: (f: File | null) => void;
  uploading?: boolean;
}

export default function RoomImagePicker({ file, onChange, uploading }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const pick = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
    onChange(f);
  };

  return (
    <div className="space-y-2">
      <Label>Cover image (optional)</Label>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
      {file && preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border/40 aspect-[16/7]">
          <img src={preview} alt="Room cover" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          <Button type="button" size="icon" variant="secondary" className="absolute top-2 right-2 h-7 w-7" onClick={() => { pick(null); if (ref.current) ref.current.value = ''; }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="w-full aspect-[16/7] rounded-lg border border-dashed border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:border-primary/50 transition-colors">
          <ImagePlus className="h-5 w-5" />
          Add an image
        </button>
      )}
    </div>
  );
}
