import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, MessageSquare, User, Cpu } from "lucide-react";
import type { FlowSessionApi } from "@/hooks/useFlowSession";
import { cn } from "@/lib/utils";

interface Props {
  api: FlowSessionApi;
}

const SUGGESTED = [
  "What's the single biggest risk and how do I mitigate it first?",
  "Which two variables, if improved, would most lift feasibility?",
  "Compare the model against competitors in this domain.",
  "Draft a 90-day action plan based on these dependencies.",
];

export default function FlowInvestigatePanel({ api }: Props) {
  const { messages, asking, askQuestion, sessionId } = api;
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, asking]);

  const onSend = () => {
    const q = draft.trim();
    if (!q || asking) return;
    setDraft("");
    askQuestion(q);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[520px] animate-fade-in">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 blur-md opacity-60" />
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Investigate Deeper
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Ask follow-up questions. All Q&A is saved to this investigation.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-background/60 to-background/30 backdrop-blur-xl p-4 space-y-3"
      >
        {messages.length === 0 && !asking && (
          <div className="text-center py-6">
            <Sparkles className="h-6 w-6 text-violet-400 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-muted-foreground mb-4">
              Start the investigation. Try one of these:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setDraft(s);
                  }}
                  className="text-left text-[11px] p-2.5 rounded-lg border border-white/10 bg-background/40 hover:bg-background/60 hover:border-violet-400/40 transition text-foreground/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex gap-2.5 animate-fade-in",
              m.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center border",
                m.role === "user"
                  ? "bg-cyan-500/20 border-cyan-400/40"
                  : "bg-violet-500/20 border-violet-400/40"
              )}
            >
              {m.role === "user" ? (
                <User className="h-3.5 w-3.5 text-cyan-300" />
              ) : (
                <Cpu className="h-3.5 w-3.5 text-violet-300" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap border backdrop-blur-xl",
                m.role === "user"
                  ? "bg-cyan-500/10 border-cyan-400/30 text-foreground"
                  : "bg-background/60 border-white/10 text-foreground/90"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {asking && (
          <div className="flex gap-2.5 animate-fade-in">
            <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center border bg-violet-500/20 border-violet-400/40">
              <Cpu className="h-3.5 w-3.5 text-violet-300 animate-pulse" />
            </div>
            <div className="rounded-2xl px-3.5 py-2.5 bg-background/60 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" />
                <span className="text-xs text-muted-foreground">Investigating…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 relative rounded-2xl border border-violet-400/30 bg-background/60 backdrop-blur-xl shadow-[0_0_28px_-10px_hsl(263_70%_60%)] focus-within:border-violet-400/60 transition">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={sessionId ? "Ask anything about this Flow analysis…" : "Run an analysis first to start investigating."}
          disabled={!sessionId || asking}
          rows={2}
          className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-14 text-sm"
        />
        <Button
          type="button"
          size="icon"
          onClick={onSend}
          disabled={!sessionId || asking || !draft.trim()}
          className="absolute right-2 bottom-2 h-9 w-9 bg-gradient-to-br from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-violet-500/30"
        >
          {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
