import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, Languages, Sparkles, FileText, Save, ExternalLink } from 'lucide-react';

export interface MeetingTranscriptMeta {
  meeting_id: string;
  meeting_type: 'mentoring_session' | 'pitch_meeting' | 'calendar_booking' | 'hub_booking' | 'event' | 'other';
  host_id: string;
  participant_ids?: string[];
  title: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  meta: MeetingTranscriptMeta | null;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
];

export default function MeetingTranscriptDialog({ open, onOpenChange, meta }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [translated, setTranslated] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [busy, setBusy] = useState<null | 'summarize' | 'translate' | 'save' | 'lightpaper'>(null);

  useEffect(() => {
    if (!open || !meta || !user) return;
    setTranslated('');
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('meeting_id', meta.meeting_id)
        .eq('meeting_type', meta.meeting_type)
        .maybeSingle();
      if (data) {
        setTranscriptId(data.id);
        setTranscript(data.transcript_text || '');
        setSummary(data.summary_text || '');
      } else {
        setTranscriptId(null);
        setTranscript('');
        setSummary('');
      }
      setLoading(false);
    })();
  }, [open, meta, user]);

  const isHost = !!user && !!meta && user.id === meta.host_id;

  const saveTranscript = async () => {
    if (!user || !meta) return;
    if (!isHost) {
      toast({ title: 'Read-only', description: 'Only the meeting host can edit this transcript.', variant: 'destructive' });
      return;
    }
    setBusy('save');
    try {
      if (transcriptId) {
        const { error } = await supabase
          .from('meeting_transcripts')
          .update({ transcript_text: transcript, summary_text: summary })
          .eq('id', transcriptId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('meeting_transcripts')
          .insert({
            meeting_id: meta.meeting_id,
            meeting_type: meta.meeting_type,
            host_id: meta.host_id,
            participant_ids: meta.participant_ids || [],
            title: meta.title,
            transcript_text: transcript,
            summary_text: summary,
          })
          .select()
          .single();
        if (error) throw error;
        setTranscriptId(data.id);
      }
      toast({ title: 'Saved', description: 'Transcript saved.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      toast({ title: 'No transcript', description: 'Add or paste a transcript first.', variant: 'destructive' });
      return;
    }
    setBusy('summarize');
    try {
      const { data, error } = await supabase.functions.invoke('ai-text-summarizer', {
        body: {
          text: transcript,
          sourceType: 'meeting_transcript',
          sourceId: meta?.meeting_id,
          keyPointsCount: 5,
        },
      });
      if (error) throw error;
      const newSummary = (data?.summary_text ? `${data.summary_text}\n\n**Key points:**\n- ${(data.key_points || []).join('\n- ')}` : '');
      setSummary(newSummary);
      toast({ title: 'Summary generated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleTranslate = async () => {
    const text = transcript.trim();
    if (!text) {
      toast({ title: 'No transcript', description: 'Add or paste a transcript first.', variant: 'destructive' });
      return;
    }
    setBusy('translate');
    try {
      const { data, error } = await supabase.functions.invoke('ai-translator', {
        body: { text, targetLanguage: targetLang },
      });
      if (error) throw error;
      setTranslated(data?.translated_text || data?.translation || '');
      toast({ title: 'Translated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const sendToLightpaper = () => {
    if (!meta) return;
    const body = [
      `# ${meta.title}`,
      '',
      summary ? `## Summary\n\n${summary}\n\n---\n` : '',
      transcript ? `## Transcript\n\n${transcript}` : '',
      translated ? `\n\n---\n## Translation (${targetLang})\n\n${translated}` : '',
    ].join('\n');

    setBusy('lightpaper');
    window.dispatchEvent(new CustomEvent('genius-open-in-lightpaper', {
      detail: { content: body, title: meta.title },
    }));
    onOpenChange(false);
    setTimeout(() => {
      navigate('/lightpaper');
      setBusy(null);
    }, 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Transcript
          </DialogTitle>
          <DialogDescription>
            {meta?.title} · <Badge variant="outline" className="ml-1">{meta?.meeting_type.replace('_', ' ')}</Badge>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transcript</label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={isHost ? 'Paste or type the meeting transcript here...' : 'No transcript available yet.'}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                  readOnly={!isHost}
                />
              </div>

              {summary && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Smart Summary</label>
                  <div className="mt-1 p-3 rounded-md bg-muted/40 text-sm whitespace-pre-wrap">{summary}</div>
                </div>
              )}

              {translated && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Translation ({LANGUAGES.find((l) => l.code === targetLang)?.label})
                  </label>
                  <div className="mt-1 p-3 rounded-md bg-muted/40 text-sm whitespace-pre-wrap">{translated}</div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t">
          <div className="flex flex-wrap gap-2 flex-1">
            <Button size="sm" variant="outline" onClick={handleSummarize} disabled={!!busy}>
              {busy === 'summarize' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Smart Summary
            </Button>
            <div className="flex items-center gap-1">
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleTranslate} disabled={!!busy}>
                {busy === 'translate' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Languages className="h-4 w-4 mr-1" />}
                Translate
              </Button>
            </div>
            {isHost && (
              <Button size="sm" variant="outline" onClick={saveTranscript} disabled={!!busy}>
                {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            )}
            <Button size="sm" onClick={sendToLightpaper} disabled={!!busy}>
              {busy === 'lightpaper' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
              Open in LightPaper
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
