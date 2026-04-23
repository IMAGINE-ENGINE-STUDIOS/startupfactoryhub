import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Sparkles, MapPin } from "lucide-react";
import type { FlowMessage } from "@/hooks/useFlowSession";

interface Props {
  messages: FlowMessage[];
  asking: boolean;
  onJump?: (id: string) => void;
}

/**
 * Horizontal animated roadmap of investigation milestones.
 * Each user question becomes a milestone node; answer is paired beneath.
 * New milestones animate in (scale + glow pulse) and auto-scroll into view.
 */
export default function FlowRoadmap({ messages, asking, onJump }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pair user→assistant turns
  const turns: { id: string; question: string; answer?: string; answered: boolean }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === "user") {
      const next = messages[i + 1];
      const ans = next && next.role === "assistant" ? next : undefined;
      turns.push({
        id: m.id,
        question: m.content,
        answer: ans?.content,
        answered: !!ans,
      });
      if (ans) i++;
    }
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [turns.length, asking]);

  if (turns.length === 0 && !asking) return null;

  return (
    <div className="relative rounded-xl border border-white/10 bg-gradient-to-b from-background/60 to-background/30 backdrop-blur-xl px-3 py-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-3.5 w-3.5 text-violet-300" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-violet-300">
          Investigation Roadmap
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">
          {turns.length} {turns.length === 1 ? "milestone" : "milestones"}
        </span>
      </div>

      {/* Track */}
      <div
        ref={scrollRef}
        className="relative overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        <div className="relative flex items-stretch gap-0 min-w-full pt-1">
          {/* Animated baseline */}
          <div className="pointer-events-none absolute left-0 right-0 top-[34px] h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-400/60 to-cyan-400/60" />
          <div
            className="pointer-events-none absolute left-0 top-[34px] h-[2px] bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 shadow-[0_0_12px_hsl(263_80%_60%)]"
            style={{
              width: `${Math.min(100, (turns.filter((t) => t.answered).length / Math.max(turns.length, 1)) * 100)}%`,
              transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          {turns.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onJump?.(t.id)}
              className="group relative flex flex-col items-center text-left shrink-0 min-w-[180px] px-3 animate-fade-in"
              style={{ animationDelay: `${Math.min(idx * 60, 240)}ms` }}
            >
              {/* Question label above the node */}
              <div className="mb-1 max-w-[170px] text-[10px] leading-tight text-foreground/80 line-clamp-2 text-center font-medium">
                {t.question}
              </div>

              {/* Node */}
              <div className="relative">
                {t.answered && (
                  <span className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md animate-pulse" />
                )}
                <div
                  className={cn(
                    "relative h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    t.answered
                      ? "bg-gradient-to-br from-violet-500 to-cyan-400 border-white/40 shadow-[0_0_14px_hsl(190_90%_55%)]"
                      : "bg-background border-violet-400/50"
                  )}
                >
                  {t.answered ? (
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <MessageSquare className="h-2.5 w-2.5 text-violet-300" />
                  )}
                </div>
              </div>

              {/* Answer preview below */}
              <div
                className={cn(
                  "mt-2 max-w-[170px] text-[10px] leading-snug text-center rounded-md px-2 py-1 border transition-all",
                  t.answered
                    ? "border-cyan-400/30 bg-cyan-500/5 text-foreground/70 group-hover:border-cyan-400/60 group-hover:bg-cyan-500/10"
                    : "border-dashed border-white/10 bg-background/30 text-muted-foreground/60 italic"
                )}
              >
                <div className="line-clamp-3">
                  {t.answer || "awaiting…"}
                </div>
              </div>
            </button>
          ))}

          {asking && (
            <div className="flex flex-col items-center shrink-0 min-w-[180px] px-3 animate-fade-in">
              <div className="mb-1 max-w-[170px] text-[10px] leading-tight text-violet-300/80 text-center font-medium">
                Charting next milestone…
              </div>
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-violet-400/50 blur-md animate-pulse" />
                <div className="relative h-5 w-5 rounded-full border-2 border-violet-400 bg-background flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
                </div>
              </div>
              <div className="mt-2 max-w-[170px] text-[10px] text-center rounded-md px-2 py-1 border border-violet-400/30 bg-violet-500/5 text-violet-200/80">
                <span className="inline-flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-violet-300 animate-bounce" />
                  <span className="h-1 w-1 rounded-full bg-violet-300 animate-bounce [animation-delay:120ms]" />
                  <span className="h-1 w-1 rounded-full bg-violet-300 animate-bounce [animation-delay:240ms]" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
