// @ts-nocheck -- Imagine Studio v2
/**
 * The ONE agent chat UI (founder directive 2026-10-25): every agent
 * conversation in the office — desk bots, the Manager, executives — uses
 * this exact thread + composer, in the Genius bubble chat's language
 * (gradient user bubbles, glass assistant bubbles with markdown) built
 * from the Agents tab's glass widget tokens. The composer input is
 * text-base (16px) on purpose: anything smaller makes iOS Safari zoom
 * the whole page on focus and the 3D view stays zoomed with no way back.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Send, Phone, PhoneOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import VoiceMicButton from "@/components/voice/VoiceMicButton";
import { useVoiceConversation, talkStatusLabel } from "@/lib/voice/useVoiceConversation";

export const GLASS_PANEL =
  "rounded-[2rem] border border-border bg-card/70 shadow-[0_10px_40px_rgba(6,78,59,0.08)] backdrop-blur-xl";
export const GLASS_INPUT =
  "rounded-2xl border-input bg-background/60 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-emerald-400/60";
export const GRADIENT_BUTTON =
  "rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-600 disabled:shadow-none";

export interface ChatMsg { role: "user" | "assistant"; content: string }

export function AgentChat({
  name,
  onSend,
  emptyText,
  placeholder,
  disabledNote,
  composerExtra,
  persistKey,
  onUserMessage,
}: {
  name: string;
  onSend: (text: string) => Promise<string>;
  emptyText: ReactNode;
  placeholder: string;
  disabledNote?: string | null;
  composerExtra?: ReactNode;
  persistKey?: string;
  onUserMessage?: (text: string) => void;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    if (!persistKey) return [];
    try {
      const p = JSON.parse(localStorage.getItem(persistKey) || "[]");
      return Array.isArray(p) ? p.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-60) : [];
    } catch { return []; }
  });
  /* Draft armor (founder report 2026-10-25: typed text vanishing in
   * the CEO/Chairman chats): the composer draft is mirrored to
   * sessionStorage and restored on mount, so even if this component is
   * ever remounted by a parent re-render storm, what the user typed is
   * NEVER lost. Cleared when the message is sent. */
  const draftKey = persistKey ? `${persistKey}:draft` : null;
  const [input, setInput] = useState(() => {
    if (!draftKey) return "";
    try { return sessionStorage.getItem(draftKey) || ""; } catch { return ""; }
  });
  useEffect(() => {
    if (!draftKey) return;
    try {
      if (input) sessionStorage.setItem(draftKey, input);
      else sessionStorage.removeItem(draftKey);
    } catch { /* session only */ }
  }, [input, draftKey]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, busy]);
  useEffect(() => {
    if (!persistKey) return;
    try { localStorage.setItem(persistKey, JSON.stringify(msgs.slice(-60))); } catch { /* session only */ }
  }, [msgs, persistKey]);

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy || disabledNote) return;
    setMsgs((m) => [...m, { role: "user", content: text }]);
    onUserMessage?.(text);
    setBusy(true);
    try {
      const out = await onSend(text);
      setMsgs((m) => [...m, { role: "assistant", content: out || "Done." }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: `That run failed: ${e?.message || "unknown error"}` }]);
    }
    setBusy(false);
  };
  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendText(text);
  };

  /* Voice (founder directive 2026-10-25): the mic dictates into the
   * composer (on-device Whisper, self-hosted model); Talk mode runs the
   * realtime loop — speak, hear the reply spoken in this agent's role
   * voice, listen again. Persona comes from the agent's name/role. */
  const lastAssistant = (() => {
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === "assistant") return { id: `m${i}`, text: msgs[i].content };
    return null;
  })();
  const voice = useVoiceConversation({
    roleText: name,
    lastAssistant,
    busy,
    onUserText: (t) => { void sendText(t); },
  });

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain touch-pan-y px-4 py-4">
        <div className="space-y-3">
          {msgs.length === 0 && <div className="text-sm leading-relaxed text-muted-foreground">{emptyText}</div>}
          {msgs.map((m, i) => (
            m.role === "user" ? (
              <div key={i} className="ml-auto w-fit min-w-0 max-w-[88%] break-words [overflow-wrap:anywhere] rounded-[1.4rem] rounded-br-md bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)]">{m.content}</div>
            ) : (
              <div key={i} className={`${GLASS_PANEL} w-fit min-w-0 max-w-[94%] break-words [overflow-wrap:anywhere] rounded-[1.4rem] rounded-bl-md px-4 py-3 text-sm leading-relaxed`}>
                <div className="[&>p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:font-mono [&_pre]:overflow-x-auto"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              </div>
            )
          ))}
          {busy && <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{name} is working…</div>}
        </div>
      </div>
      <div className="shrink-0 border-t border-border bg-background/80 px-4 pt-3 backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        {voice.talkOn && (
          <div className="flex items-center gap-2 pb-2 text-[11px] font-medium text-emerald-500" role="status">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
            {talkStatusLabel(voice.talkState, voice.loadPct, name)}
          </div>
        )}
        <div className="flex items-center gap-2">
          {disabledNote ? (
            <div className="min-w-0 flex-1 px-1 py-2 text-xs text-muted-foreground">{disabledNote}</div>
          ) : (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
                placeholder={placeholder}
                className={`${GLASS_INPUT} min-w-0 flex-1 border px-4 py-2.5 text-base outline-none placeholder:text-muted-foreground/60`}
              />
              <VoiceMicButton onText={(t) => setInput((cur) => (cur.trim() ? `${cur.trim()} ${t}` : t))} className="h-10 w-10" />
              <button onClick={() => void send()} disabled={busy || !input.trim()} className={`${GRADIENT_BUTTON} shrink-0 px-4 py-2.5 disabled:opacity-50`} aria-label={`Send to ${name}`}><Send className="h-4 w-4" /></button>
              <button
                onClick={voice.toggleTalk}
                title={voice.talkOn ? `End the voice conversation with ${name}` : `Talk with ${name}: hands-free voice conversation — replies are spoken in ${name}'s role voice`}
                aria-label={voice.talkOn ? "End voice conversation" : `Start voice conversation with ${name}`}
                className={`shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${voice.talkOn ? "border-emerald-400 bg-emerald-500/15 text-emerald-500 animate-pulse" : "border-border/60 text-muted-foreground hover:text-foreground hover:border-emerald-400/60"}`}
              >
                {voice.talkOn ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              </button>
            </>
          )}
          {composerExtra}
        </div>
      </div>
    </div>
  );
}
