import { useEffect, useRef, useState } from 'react';
import { useChat } from '@livekit/components-react';
import { Send, Paperclip, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Att = { url: string; name: string; size: number; type: string };
type Msg = { id: string; from: string; mine: boolean; text: string; ts: number; att?: Att };

const initials = (n: string) => n.split(/[\s_-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';
const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Attachment messages travel as tagged JSON text so every client renders them;
// plain text stays plain text.
const ATT_PREFIX = 'SFHATT1:';
const encode = (text: string, att?: Att) => (att ? ATT_PREFIX + JSON.stringify({ text, att }) : text);
const decode = (raw: string): { text: string; att?: Att } => {
  if (raw.startsWith(ATT_PREFIX)) {
    try { const j = JSON.parse(raw.slice(ATT_PREFIX.length)); if (j && j.att && j.att.url) return { text: j.text || '', att: j.att }; } catch { /* fall through */ }
  }
  return { text: raw };
};
const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);

async function uploadChatFile(room: string, f: File): Promise<Att> {
  const safe = f.name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'file';
  const path = `chat/${room}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
  const { error } = await supabase.storage.from('live-shares').upload(path, f, { contentType: f.type || 'application/octet-stream' });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from('live-shares').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (e2 || !data?.signedUrl) throw e2 || new Error('Could not create a link for the file');
  return { url: data.signedUrl, name: f.name, size: f.size, type: f.type || 'application/octet-stream' };
}

function AttView({ att, mine }: { att: Att; mine: boolean }) {
  if (att.type.startsWith('image/')) return <a href={att.url} target="_blank" rel="noreferrer" className="block"><img src={att.url} alt={att.name} className="max-w-[240px] w-full rounded-xl" /></a>;
  if (att.type.startsWith('video/')) return <video src={att.url} controls className="max-w-[260px] w-full rounded-xl bg-black" />;
  if (att.type.startsWith('audio/')) return <audio src={att.url} controls className="w-[240px] max-w-full" />;
  return (
    <a href={att.url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl ${mine ? 'bg-white/10 text-white' : 'bg-white text-zinc-900 border border-zinc-200'}`}>
      <FileText className="w-4 h-4 shrink-0" />
      <span className="min-w-0">
        <span className="block text-xs truncate">{att.name}</span>
        <span className="block font-mono text-[10px] opacity-60">{fmtSize(att.size)} • Tap to open</span>
      </span>
    </a>
  );
}

function ChatView({ msgs, send, onCount, live, room }: { msgs: Msg[]; send: (t: string, att?: Att) => void; onCount: (n: number) => void; live: boolean; room: string }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(0);
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { onCount(msgs.length); end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]); // eslint-disable-line
  const submit = () => { const t = text.trim(); if (!t) return; send(t); setText(''); };
  const shareFiles = async (files: FileList | File[]) => {
    const list = [...files]; if (!list.length) return;
    const caption = text.trim(); if (caption) setText('');
    let first = true;
    for (const f of list) {
      setUploading((u) => u + 1);
      try { const att = await uploadChatFile(room, f); send(first ? caption : '', att); }
      catch { setErr(`Could not upload ${f.name}. Try again.`); setTimeout(() => setErr(''), 6000); }
      finally { setUploading((u) => u - 1); }
      first = false;
    }
  };
  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <p className="font-mono text-[11px] text-zinc-500 mb-3">{live ? 'Live chat • everyone in the call • share any file or media' : 'Not connected • messages stay on this screen'}</p>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.length === 0 && <p className="text-sm text-zinc-500">No messages yet. Say hello.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.mine ? 'flex-row-reverse' : ''}`}>
            <span className="w-8 h-8 shrink-0 rounded-full bg-zinc-900 text-white font-mono text-[10px] flex items-center justify-center">{initials(m.from)}</span>
            <div className={`max-w-[75%] ${m.mine ? 'text-right' : ''}`}>
              <p className="font-mono text-[10px] text-zinc-500">{m.mine ? 'You' : m.from} • {time(m.ts)}</p>
              <div className={`mt-1 inline-block text-left text-sm px-3 py-2 rounded-2xl break-words ${m.mine ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'}`}>
                {m.text && <p>{m.text}</p>}
                {m.att && <div className={m.text ? 'mt-2' : ''}><AttView att={m.att} mine={m.mine} /></div>}
              </div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {uploading > 0 && <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-zinc-500"><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading {uploading} file{uploading > 1 ? 's' : ''}…</p>}
      {err && <p className="mt-2 text-[11px] text-red-500">{err}</p>}
      <div className="mt-3 flex gap-2">
        <button aria-label="Attach a file" title="Attach any file or media" onClick={() => fileRef.current?.click()} className="px-3 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"><Paperclip className="w-4 h-4" /></button>
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => { if (e.target.files) shareFiles(e.target.files); e.target.value = ''; }} />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          onPaste={(e) => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length) { e.preventDefault(); shareFiles(fs); } }}
          placeholder="Type a message or paste a file" className="flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900" />
        <button aria-label="Send" onClick={submit} className="px-4 rounded-xl bg-zinc-900 text-white"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function LiveChat({ onCount, onSent, room }: { onCount: (n: number) => void; onSent?: (t: string) => void; room: string }) {
  const { chatMessages, send } = useChat();
  const msgs: Msg[] = chatMessages.map((m) => {
    const d = decode(m.message);
    return { id: m.id ?? String(m.timestamp), ts: m.timestamp, text: d.text, att: d.att, mine: !!m.from?.isLocal, from: m.from?.name || m.from?.identity || 'Guest' };
  });
  return <ChatView live room={room} msgs={msgs} onCount={onCount}
    send={(t, att) => { send(encode(t, att)).then(() => onSent?.(att ? `📎 ${att.name}` : t)).catch(() => {}); }} />;
}

export function LocalChat({ onCount, room }: { onCount: (n: number) => void; room: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  return <ChatView live={false} room={room} msgs={msgs} onCount={onCount}
    send={(t, att) => setMsgs((m) => [...m, { id: crypto.randomUUID(), from: 'You', mine: true, text: t, att, ts: Date.now() }])} />;
}
