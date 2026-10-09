import { useEffect, useRef, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { districtChat, type DistrictChatState } from '@/lib/districtChatBus';

/** District chat rendered inside the Genius bubble. */
export default function DistrictChatTab({ state }: { state: DistrictChatState }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [state?.msgs.length]);
  if (!state) return <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground text-center">Join a district (like the Plaza) to chat with everyone there.</div>;
  const send = () => { const t = text.trim(); if (!t) return; districtChat.send(t.slice(0, 500)); setText(''); };
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between text-xs">
        <span className="font-medium">{state.title}</span>
        <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3.5 w-3.5" />{state.online} online</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.msgs.length === 0 && <p className="text-xs text-muted-foreground text-center mt-6">No messages yet. Say hello.</p>}
        {state.msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${m.me ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {!m.me && <div className="text-[10px] opacity-70">{m.from}</div>}
            <div className="break-words">{m.text}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="p-2 border-t border-border/40 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Message the district" maxLength={500} />
        <Button size="icon" onClick={send} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
