import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type TxLine = { id: string; speaker: string; text: string; ts: number };

export const speechSupported = () => typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export const saveLiveLog = (room: string, kind: 'transcript' | 'chat', speaker: string, content: string, userId?: string | null) => {
  const c = content.trim().slice(0, 5000);
  if (!c) return;
  supabase.from('live_session_logs' as any).insert({ room_name: room, kind, speaker: speaker.slice(0, 200), content: c, user_id: userId || null } as any).then(() => {});
};

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-transcribe`;
const CHUNK_MS = 6000;
// Whisper sometimes "hears" these in silence.
const NOISE = /^(thank you\.?|thanks for watching!?|you|\.|bye\.?)$/i;

const NativeSR: any = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : undefined;

/** Free real-time transcript: browser speech recognition first, server transcriber as fallback. */
export function useSpeechTranscriber(on: boolean, onFinal: (text: string) => void, onPartial?: (text: string) => void) {
  const cb = useRef({ onFinal, onPartial }); cb.current = { onFinal, onPartial };
  const [nativeFailed, setNativeFailed] = useState(false);
  const useNative = !!NativeSR && !nativeFailed;
  useEffect(() => {
    if (!on || !useNative) return;
    let stopped = false;
    let errors = 0;
    const r = new NativeSR();
    r.continuous = true; r.interimResults = true; r.lang = navigator.language || 'en-US';
    r.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = String(e.results[i][0]?.transcript || '').trim();
        if (!t) continue;
        if (e.results[i].isFinal) { cb.current.onFinal(t); errors = 0; } else interim += t + ' ';
      }
      cb.current.onPartial?.(interim.trim());
    };
    r.onerror = (e: any) => {
      if (['not-allowed', 'service-not-allowed', 'network', 'language-not-supported'].includes(e?.error)) {
        if (++errors >= 2 || e?.error !== 'network') { stopped = true; setNativeFailed(true); }
      }
    };
    r.onend = () => { if (!stopped) { try { r.start(); } catch { /* ignore */ } } };
    try { r.start(); } catch { setNativeFailed(true); }
    return () => { stopped = true; try { r.stop(); } catch { /* ignore */ } cb.current.onPartial?.(''); };
  }, [on, useNative]);
  useEffect(() => {
    if (!on || useNative || !speechSupported()) return;
    let stopped = false;
    let stream: MediaStream | null = null;
    let rec: MediaRecorder | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    const send = async (blob: Blob) => {
      if (blob.size < 2000) return;
      cb.current.onPartial?.('Writing...');
      try {
        const fd = new FormData();
        fd.append('audio', new File([blob], `chunk.${ext}`, { type: blob.type || mime }));
        fd.append('lang', (navigator.language || 'en').slice(0, 2));
        const r = await fetch(FN_URL, { method: 'POST', headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }, body: fd });
        const d = await r.json().catch(() => ({}));
        const t = String(d.text || '').trim();
        if (t && !NOISE.test(t)) cb.current.onFinal(t);
        else if (!r.ok) console.warn('Transcribe failed', d);
      } catch (e) { console.warn('Transcribe failed', e); }
      cb.current.onPartial?.('');
    };
    // Each chunk is a fresh recorder so every file is complete on its own.
    const cycle = () => {
      if (stopped || !stream) return;
      const parts: Blob[] = [];
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
      rec.onstop = () => { send(new Blob(parts, { type: mime })); cycle(); };
      rec.start();
      timer = setTimeout(() => { try { rec?.state === 'recording' && rec.stop(); } catch { /* ignore */ } }, CHUNK_MS);
    };
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => { if (stopped) { s.getTracks().forEach((t) => t.stop()); return; } stream = s; cycle(); })
      .catch((e) => console.warn('Mic for transcript failed', e));
    return () => {
      stopped = true; clearTimeout(timer);
      try { if (rec?.state === 'recording') rec.stop(); } catch { /* ignore */ }
      stream?.getTracks().forEach((t) => t.stop());
      cb.current.onPartial?.('');
    };
  }, [on]);
}

export const downloadTranscript = (room: string, lines: TxLine[]) => {
  const body = lines.map((l) => `[${new Date(l.ts).toLocaleTimeString()}] ${l.speaker}: ${l.text}`).join('\n');
  const blob = new Blob([`Startup Factory Hub - ${room} transcript\n${new Date().toLocaleString()}\n\n${body}\n`], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Transcript-${room}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

export function TranscriptPanel({ room, lines, on, onToggle }: { room: string; lines: TxLine[]; on: boolean; onToggle: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines.length]);
  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onToggle} className={`px-3 py-1.5 rounded-full text-xs font-mono ${on ? 'bg-zinc-900 text-white' : 'border border-zinc-200 text-zinc-800'}`}>{on ? 'Transcribing my voice' : 'Turn on transcript'}</button>
        <button onClick={() => downloadTranscript(room, lines)} disabled={!lines.length} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-xs text-zinc-800 disabled:opacity-40"><Download className="w-3.5 h-3.5" />Download</button>
      </div>
      {!speechSupported() && <p className="text-xs text-red-500 mb-2">Live transcript needs Chrome or Edge. You can still read and download what others say.</p>}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {lines.length === 0 && <p className="text-sm text-zinc-500">No words yet. Turn on the transcript and speak with your mic on.</p>}
        {lines.map((l) => (
          <p key={l.id} className="text-sm text-zinc-800"><span className="font-mono text-[10px] text-zinc-500 mr-1.5">{new Date(l.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span className="font-medium">{l.speaker}:</span> {l.text}</p>
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}
