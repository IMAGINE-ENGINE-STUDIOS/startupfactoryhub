import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, Sparkles, ScanLine, X } from 'lucide-react';

interface ExtractedFields {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notes: string;
}

const EMPTY_FIELDS: ExtractedFields = {
  name: '', title: '', company: '', email: '', phone: '', website: '', address: '', notes: '',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

// Client-side compress to keep payload small (max 1600px, JPEG 0.85)
async function compressImage(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
  );
  const dataUrl: string = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  return { dataUrl, blob };
}

export default function BusinessCardScannerDialog({ open, onOpenChange, onSaved }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ExtractedFields>(EMPTY_FIELDS);
  const [extracted, setExtracted] = useState(false);

  const reset = () => {
    setImageDataUrl(null);
    setImageBlob(null);
    setFields(EMPTY_FIELDS);
    setExtracted(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { dataUrl, blob } = await compressImage(file);
      setImageDataUrl(dataUrl);
      setImageBlob(blob);
      setExtracted(false);
      setFields(EMPTY_FIELDS);
    } catch (err: any) {
      toast({ title: 'Image error', description: err.message, variant: 'destructive' });
    }
  };

  const extractFields = async () => {
    if (!imageDataUrl) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-business-card', {
        body: { image: imageDataUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFields({ ...EMPTY_FIELDS, ...data.fields });
      setExtracted(true);
      toast({ title: 'Fields extracted', description: 'Review and edit before saving.' });
    } catch (err: any) {
      toast({ title: 'Extraction failed', description: err.message, variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  };

  const saveToCRM = async () => {
    if (!user) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    if (!fields.name && !fields.company && !fields.email) {
      toast({
        title: 'Missing info',
        description: 'Add at least a name, company, or email.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      // Ensure pipeline + Leads stage
      const { data: pipelines } = await supabase
        .from('crm_pipelines')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      let pipelineId = pipelines?.[0]?.id as string | undefined;
      if (!pipelineId) {
        const { data: newPipe, error: pipeErr } = await supabase
          .from('crm_pipelines')
          .insert({ user_id: user.id, name: 'Default' })
          .select('id')
          .single();
        if (pipeErr) throw pipeErr;
        pipelineId = newPipe.id;
      }
      const { data: stages } = await supabase
        .from('crm_stages')
        .select('id, name')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true });
      let leadsStage = stages?.find((s: any) => s.name.toLowerCase() === 'leads') || stages?.[0];
      if (!leadsStage) {
        const { data: newStage, error: stErr } = await supabase
          .from('crm_stages')
          .insert({ pipeline_id: pipelineId, name: 'Leads', color: '#3b82f6', position: 0 })
          .select('id, name')
          .single();
        if (stErr) throw stErr;
        leadsStage = newStage;
      }

      // Upload image to storage: <user_id>/<timestamp>-<random>.jpg
      let imagePath: string | null = null;
      if (imageBlob) {
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const path = `${user.id}/${filename}`;
        const { error: upErr } = await supabase.storage
          .from('business-cards')
          .upload(path, imageBlob, { contentType: 'image/jpeg', upsert: false });
        if (upErr) throw upErr;
        imagePath = path;
      }

      const title = fields.name || fields.company || fields.email || 'Business Card Contact';
      const description = [fields.title, fields.company].filter(Boolean).join(' · ') || null;

      const { error: insErr } = await supabase.from('crm_cards').insert({
        stage_id: leadsStage.id,
        user_id: user.id,
        title,
        company_name: fields.company || null,
        description,
        contact_name: fields.name || null,
        contact_email: fields.email || null,
        contact_phone: fields.phone || null,
        notes: fields.notes || null,
        priority: 'medium',
        status: 'active',
        tags: ['business-card'],
        tasks: [],
        image_url: imagePath,
        metadata: {
          website: fields.website || null,
          address: fields.address || null,
          source: 'business-card-scan',
        },
      });
      if (insErr) throw insErr;

      toast({
        title: 'Contact saved',
        description: `Added to "${leadsStage.name}" in your CRM.`,
      });
      handleClose(false);
      onSaved?.();
    } catch (err: any) {
      console.error('Save business card error:', err);
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background backdrop-blur-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan Business Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imageDataUrl ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                <span>Take photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                <span>Upload image</span>
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imageDataUrl} alt="Business card" className="w-full max-h-64 object-contain bg-muted" />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={reset}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!extracted && (
                <Button onClick={extractFields} disabled={extracting} className="w-full">
                  {extracting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting fields...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Extract fields with AI</>
                  )}
                </Button>
              )}

              {extracted && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Name</Label>
                    <Input value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input value={fields.title} onChange={(e) => setFields({ ...fields, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Company</Label>
                    <Input value={fields.company} onChange={(e) => setFields({ ...fields, company: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input type="email" value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input value={fields.phone} onChange={(e) => setFields({ ...fields, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Website</Label>
                    <Input value={fields.website} onChange={(e) => setFields({ ...fields, website: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Address</Label>
                    <Input value={fields.address} onChange={(e) => setFields({ ...fields, address: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Notes</Label>
                    <Textarea rows={2} value={fields.notes} onChange={(e) => setFields({ ...fields, notes: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 flex gap-2 pt-2">
                    <Button variant="outline" onClick={reset} className="flex-1">Scan another</Button>
                    <Button onClick={saveToCRM} disabled={saving} className="flex-1">
                      {saving ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        'Save to CRM'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
