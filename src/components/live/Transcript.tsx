import { useEffect, useRef, useState } from 'react';
import { Download, Languages, Loader2 } from 'lucide-react';
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

/** Free transcript: records mic in short chunks and sends them to the speech-to-text service. */
export function useSpeechTranscriber(on: boolean, onFinal: (text: string) => void, onPartial?: (text: string) => void) {
  const cb = useRef({ onFinal, onPartial }); cb.current = { onFinal, onPartial };
  useEffect(() => {
    if (!on || !speechSupported()) return;
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

export const TRANSLATE_LANGS: { code: string; name: string }[] = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' }, { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' }, { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' }, { code: 'tr', name: 'Turkish' }, { code: 'pl', name: 'Polish' },
  { code: 'uk', name: 'Ukrainian' }, { code: 'vi', name: 'Vietnamese' }, { code: 'id', name: 'Indonesian' },
  { code: 'tl', name: 'Tagalog' }, { code: 'th', name: 'Thai' }, { code: 'sv', name: 'Swedish' },
  { code: 'el', name: 'Greek' }, { code: 'he', name: 'Hebrew' }, { code: 'fa', name: 'Persian' },
];

const TRANSLATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/live-translate`;

/** Free translation on the platform's own AI — no credits, no outside service. */
export async function translateTexts(texts: string[], target: string): Promise<string[] | null> {
  try {
    const r = await fetch(TRANSLATE_URL, { method: 'POST', headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ texts, target }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !Array.isArray(d.translations)) return null;
    return d.translations.map((t: unknown) => String(t ?? ''));
  } catch { return null; }
}

export const downloadTranscript = (room: string, lines: TxLine[], translations?: Map<string, string>, langName?: string) => {
  const body = lines.map((l) => `[${new Date(l.ts).toLocaleTimeString()}] ${l.speaker}: ${translations?.get(l.id) ?? l.text}`).join('\n');
  const blob = new Blob([`Startup Factory Hub - ${room} transcript\n${new Date().toLocaleString()}${langName ? `\nTranslated into ${langName} (free SFH AI translation)` : ''}\n\n${body}\n`], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Transcript-${room}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

export function TranscriptPanel({ room, lines, on, onToggle }: { room: string; lines: TxLine[]; on: boolean; onToggle: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  // Translator: pick a language and every line is translated live, for free,
  // by the platform AI. The original stays under each translated line.
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('sfh-tx-lang') || ''; } catch { return ''; } });
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [translating, setTranslating] = useState(false);
  const inflight = useRef<Set<string>>(new Set());
  const translationsRef = useRef(translations); translationsRef.current = translations;

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lines.length, translations]);
  useEffect(() => { try { localStorage.setItem('sfh-tx-lang', lang); } catch { /* ignore */ } setTranslations(new Map()); inflight.current.clear(); }, [lang]);

  useEffect(() => {
    if (!lang) return;
    let stop = false;
    const tick = async () => {
      const pending = lines.filter((l) => l.text.trim() && !translationsRef.current.has(l.id) && !inflight.current.has(l.id)).slice(0, 25);
      if (!pending.length) { setTranslating(false); return; }
      pending.forEach((l) => inflight.current.add(l.id));
      setTranslating(true);
      const out = await translateTexts(pending.map((l) => l.text), lang);
      pending.forEach((l) => inflight.current.delete(l.id));
      if (!stop && out) setTranslations((prev) => { const next = new Map(prev); pending.forEach((l, i) => { if (out[i]) next.set(l.id, out[i]); }); return next; });
      setTranslating(false);
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => { stop = true; clearInterval(t); };
  }, [lang, lines]);

  const langName = lang ? TRANSLATE_LANGS.find((x) => x.code === lang)?.name : undefined;
  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={onToggle} className={`px-3 py-1.5 rounded-full text-xs font-mono ${on ? 'bg-zinc-900 text-white' : 'border border-zinc-200 text-zinc-800'}`}>{on ? 'Transcribing my voice' : 'Turn on transcript'}</button>
        <span className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-zinc-500" />
          <select aria-label="Translate transcript" value={lang} onChange={(e) => setLang(e.target.value)} className="text-xs border border-zinc-200 rounded-full px-2 py-1.5 bg-white text-zinc-800 max-w-[128px]">
            <option value="">Original</option>
            {TRANSLATE_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          {lang && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-600/20">FREE</span>}
          {translating && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />}
        </span>
        <button onClick={() => downloadTranscript(room, lines, lang ? translations : undefined, langName)} disabled={!lines.length} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-xs text-zinc-800 disabled:opacity-40"><Download className="w-3.5 h-3.5" />Download</button>
      </div>
      {!speechSupported() && <p className="text-xs text-red-500 mb-2">Live transcript needs Chrome or Edge. You can still read and download what others say.</p>}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {lines.length === 0 && <p className="text-sm text-zinc-500">No words yet. Turn on the transcript and speak with your mic on.</p>}
        {lines.map((l) => {
          const tr = lang ? translations.get(l.id) : undefined;
          return (
            <div key={l.id}>
              <p className="text-sm text-zinc-800"><span className="font-mono text-[10px] text-zinc-500 mr-1.5">{new Date(l.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span className="font-medium">{l.speaker}:</span> {tr ?? l.text}</p>
              {tr && tr !== l.text && <p className="text-xs text-zinc-400 mt-0.5">{l.text}</p>}
            </div>
          );
        })}
        <div ref={end} />
      </div>
    </div>
  );
}
