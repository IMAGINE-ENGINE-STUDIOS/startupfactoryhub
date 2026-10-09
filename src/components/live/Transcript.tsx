import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type TxLine = { id: string; speaker: string; text: string; ts: number };

export const speechSupported = () => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export const saveLiveLog = (room: string, kind: 'transcript' | 'chat', speaker: string, content: string, userId?: string | null) => {
  const c = content.trim().slice(0, 5000);
  if (!c) return;
  supabase.from('live_session_logs' as any).insert({ room_name: room, kind, speaker: speaker.slice(0, 200), content: c, user_id: userId || null } as any).then(() => {});
};

/** Turns the local microphone's speech into text lines while `on` and the mic is live. */
export function useSpeechTranscriber(on: boolean, onFinal: (text: string) => void, onPartial?: (text: string) => void) {
  const cb = useRef({ onFinal, onPartial }); cb.current = { onFinal, onPartial };
  useEffect(() => {
    if (!on || !speechSupported()) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    let stopped = false;
    rec.onresult = (e: any) => {
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) { const t = r[0].transcript.trim(); if (t) cb.current.onFinal(t); }
        else partial += r[0].transcript;
      }
      cb.current.onPartial?.(partial.trim());
    };
    rec.onend = () => { if (!stopped) { try { rec.start(); } catch { /* restarting */ } } };
    rec.onerror = (e: any) => { if (e.error === 'not-allowed') stopped = true; };
    try { rec.start(); } catch { /* already started */ }
    return () => { stopped = true; try { rec.stop(); } catch { /* ignore */ } cb.current.onPartial?.(''); };
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
