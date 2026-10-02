import { useEffect, useRef, useState } from 'react';
import { useChat } from '@livekit/components-react';
import { Send } from 'lucide-react';

type Msg = { id: string; from: string; mine: boolean; text: string; ts: number };

const initials = (n: string) => n.split(/[\s_-]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || '?';
const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function ChatView({ msgs, send, onCount, live }: { msgs: Msg[]; send: (t: string) => void; onCount: (n: number) => void; live: boolean }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { onCount(msgs.length); end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]); // eslint-disable-line
  const submit = () => { const t = text.trim(); if (!t) return; send(t); setText(''); };
  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <p className="font-mono text-[11px] text-zinc-500 mb-3">{live ? 'Live chat • visible to everyone in the call' : 'Not connected • messages stay on this screen'}</p>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.length === 0 && <p className="text-sm text-zinc-500">No messages yet. Say hello.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.mine ? 'flex-row-reverse' : ''}`}>
            <span className="w-8 h-8 shrink-0 rounded-full bg-zinc-900 text-white font-mono text-[10px] flex items-center justify-center">{initials(m.from)}</span>
            <div className={`max-w-[75%] ${m.mine ? 'text-right' : ''}`}>
              <p className="font-mono text-[10px] text-zinc-500">{m.mine ? 'You' : m.from} • {time(m.ts)}</p>
              <p className={`mt-1 inline-block text-left text-sm px-3 py-2 rounded-2xl break-words ${m.mine ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'}`}>{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Type a message" className="flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900" />
        <button aria-label="Send" onClick={submit} className="px-4 rounded-xl bg-zinc-900 text-white"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function LiveChat({ onCount }: { onCount: (n: number) => void }) {
  const { chatMessages, send } = useChat();
  const msgs: Msg[] = chatMessages.map((m) => ({
    id: m.id ?? String(m.timestamp), ts: m.timestamp, text: m.message,
    mine: !!m.from?.isLocal, from: m.from?.name || m.from?.identity || 'Guest',
  }));
  return <ChatView live msgs={msgs} send={(t) => { send(t).catch(() => {}); }} onCount={onCount} />;
}

export function LocalChat({ onCount }: { onCount: (n: number) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  return <ChatView live={false} msgs={msgs} onCount={onCount}
    send={(t) => setMsgs((m) => [...m, { id: crypto.randomUUID(), from: 'You', mine: true, text: t, ts: Date.now() }])} />;
}
