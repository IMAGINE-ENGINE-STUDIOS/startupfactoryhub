import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, ExternalLink, Loader2, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { normalizeDeckUrl, openDeckUrl } from '@/lib/deckUrl';

interface PitchDeckUploadProps {
  companyId: string;
  currentDeckUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export default function PitchDeckUpload({ companyId, currentDeckUrl, onUploadComplete }: PitchDeckUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [link, setLink] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const isStored = !!currentDeckUrl && currentDeckUrl.includes('/storage/v1/object/public/pitch-decks/');

  const saveLink = async () => {
    const url = normalizeDeckUrl(link);
    if (!url) return;
    try { new URL(url); } catch { toast({ title: 'Invalid link', description: 'Paste a full web address.', variant: 'destructive' }); return; }
    setSavingLink(true);
    try {
      if (isStored) {
        await supabase.storage.from('pitch-decks').remove([currentDeckUrl!.split('/').slice(-2).join('/')]);
      }
      const { error } = await supabase.from('companies').update({ pitch_deck_url: url }).eq('id', companyId);
      if (error) throw error;
      onUploadComplete(url);
      setLink('');
      toast({ title: 'Link saved', description: 'Your pitch deck now opens this link.' });
    } catch (error: any) {
      toast({ title: 'Could not save link', description: error.message, variant: 'destructive' });
    } finally { setSavingLink(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 20MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Delete old deck if exists
      if (currentDeckUrl && isStored) {
        const oldPath = currentDeckUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('pitch-decks').remove([oldPath]);
      }

      // Upload new deck
      const fileExt = 'pdf';
      const fileName = `${companyId}/pitch-deck-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('pitch-decks')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pitch-decks')
        .getPublicUrl(fileName);

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ pitch_deck_url: urlData.publicUrl })
        .eq('id', companyId);

      if (updateError) throw updateError;

      onUploadComplete(urlData.publicUrl);

      toast({
        title: 'Success!',
        description: 'Pitch deck uploaded successfully.',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload pitch deck.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentDeckUrl) return;

    setDeleting(true);

    try {
      // Delete from storage
      if (isStored) {
        const path = currentDeckUrl.split('/').slice(-2).join('/');
        const { error: deleteError } = await supabase.storage.from('pitch-decks').remove([path]);
        if (deleteError) throw deleteError;
      }

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ pitch_deck_url: null })
        .eq('id', companyId);

      if (updateError) throw updateError;

      onUploadComplete('');

      toast({
        title: 'Deleted',
        description: 'Pitch deck removed successfully.',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete pitch deck.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeck = () => {
    openDeckUrl(currentDeckUrl);
  };

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Pitch Deck
        </CardTitle>
        <CardDescription>
          Upload your pitch deck in PDF format (max 20MB). This will be visible to investors, mentors, and advisors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentDeckUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{isStored ? 'Pitch Deck.pdf' : 'External pitch deck'}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[16rem]">{isStored ? 'PDF Document' : currentDeckUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openDeck} className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Deck
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remove
              </Button>
            </div>
            <div className="text-center">
              <Label htmlFor="deck-replace" className="cursor-pointer text-sm text-primary hover:underline">
                Upload New Deck
              </Label>
              <input
                id="deck-replace"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div>
            <Label 
              htmlFor="deck-upload" 
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload pitch deck</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF format, max 20MB</span>
                </>
              )}
            </Label>
            <input
              id="deck-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        )}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label className="flex items-center gap-2 text-sm"><Link2 className="h-4 w-4 text-primary" />Or use an external link</Label>
          <div className="flex gap-2">
            <Input placeholder="Docsend, Google Drive, Pitch.com, Canva..." value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveLink()} />
            <Button variant="outline" onClick={saveLink} disabled={savingLink || !link.trim()}>
              {savingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save link'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
