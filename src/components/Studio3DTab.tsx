import { useEffect, useRef, useState } from 'react';
import { Send, Box, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studio3d, type Studio3DState } from '@/lib/studio3dBus';
import VoiceMicButton from '@/components/voice/VoiceMicButton';
import { useVoiceConversation } from '@/lib/voice/useVoiceConversation';
import { Phone, PhoneOff } from 'lucide-react';

const CHIPS = ['Make it night with neon lights', 'Make the selected object twice as large', 'Add 8 street lamps around the center', 'Make the selected object spin when clicked'];

/** Genius 3D conversation rendered inside the Genius bubble. */
export default function Studio3DTab({ state }: { state: Studio3DState }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [state?.msgs.length, state?.busy]);
  /* Voice: mic dictation + Talk mode (Genius 3D speaks its replies). */
  const lastAssistant = (() => {
    const msgs = state?.msgs || [];
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role !== 'user') return { id: `s${i}`, text: msgs[i].text };
    return null;
  })();
  const voice = useVoiceConversation({
    roleText: 'Genius 3D Architect',
    lastAssistant,
    busy: !!state?.busy,
    onUserText: (t) => { if (!state?.busy) studio3d.send(t.slice(0, 4000)); },
  });
  if (!state) return <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground text-center">Open a level in the 3D Studio to build with Genius 3D.</div>;
  const send = (t = text) => { const v = t.trim(); if (!v || state.busy) return; studio3d.send(v.slice(0, 4000)); setText(''); };
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-2 border-b border-border/40 text-xs">
        <div className="flex items-center gap-1.5 font-medium"><Box className="h-3.5 w-3.5 text-primary" />{state.levelName}</div>
        <div className="text-muted-foreground mt-0.5">{state.objectCount} objects{state.selected ? ` · Selected: ${state.selected}` : ' · Nothing selected'}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.msgs.length === 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-muted-foreground text-center">Ask for a whole scene, one object or a game script. Genius knows which level and object you mean.</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {CHIPS.map((c) => <button key={c} onClick={() => send(c)} className="text-[11px] px-2 py-1 rounded-full border border-border/50 hover:bg-muted">{c}</button>)}
            </div>
          </div>
        )}
        {state.msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm break-words ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : m.error ? 'bg-destructive/15 text-destructive' : 'bg-muted'}`}>{m.text}</div>
        ))}
        {state.busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Building in the scene</div>}
        <div ref={end} />
      </div>
      <div className="p-2 border-t border-border/40 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Describe a change to this level" maxLength={4000} />
        <VoiceMicButton onText={(t) => setText((cur) => (cur.trim() ? `${cur.trim()} ${t}` : t))} className="h-9 w-9" />
        <button type="button" onClick={voice.toggleTalk} title={voice.talkOn ? "End the voice conversation" : "Talk with Genius 3D: hands-free voice conversation"} aria-label={voice.talkOn ? "End voice conversation" : "Start voice conversation"} className={`shrink-0 h-9 w-9 rounded-full border inline-flex items-center justify-center transition ${voice.talkOn ? "border-emerald-400 bg-emerald-500/15 text-emerald-500 animate-pulse" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>{voice.talkOn ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}</button>
        <Button size="icon" onClick={() => send()} disabled={state.busy} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
