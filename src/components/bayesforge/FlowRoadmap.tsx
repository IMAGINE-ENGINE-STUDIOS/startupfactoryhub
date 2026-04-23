import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Flag, Sparkles, Swords, Zap } from "lucide-react";
import type { FlowMessage } from "@/hooks/useFlowSession";

interface Props {
  messages: FlowMessage[];
  asking: boolean;
  onJump?: (id: string) => void;
}

export default function FlowRoadmap({ messages, asking, onJump }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const turns = useMemo(() => {
    const paired: { id: string; question: string; answer?: string; answered: boolean }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      if (current.role !== "user") continue;
      const next = messages[i + 1];
      const answer = next?.role === "assistant" ? next : undefined;
      paired.push({
        id: current.id,
        question: current.content,
        answer: answer?.content,
        answered: !!answer,
      });
      if (answer) i += 1;
    }
    return paired;
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [turns.length, asking]);

  if (!turns.length && !asking) return null;

  const completedTurns = turns.filter((turn) => turn.answered).length;
  const progress = Math.min(100, (completedTurns / Math.max(turns.length || 1, 1)) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-background/50 px-3 py-4 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-10 top-2 h-20 w-20 rounded-full bg-violet-500/15 blur-2xl" />
        <div className="absolute right-8 bottom-0 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
      </div>

      <div className="relative mb-3 flex items-center gap-2">
        <Swords className="h-3.5 w-3.5 text-violet-300" />
        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-violet-300">
          Investigation Questline
        </span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground/70">
          {completedTurns}/{Math.max(turns.length, completedTurns || 1)} cleared
        </span>
      </div>

      <div ref={scrollRef} className="relative overflow-x-auto pb-2 [scrollbar-width:thin]">
        <div className="relative flex min-w-max items-start gap-5 px-1 py-4">
          <div className="pointer-events-none absolute left-0 right-0 top-[52px] h-[3px] rounded-full bg-white/10" />
          <div
            className="pointer-events-none absolute left-0 top-[52px] h-[3px] rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 shadow-[0_0_20px_-4px_hsl(263_70%_60%)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
          <div
            className="pointer-events-none absolute top-[44px] z-10 transition-all duration-700"
            style={{ left: `calc(${progress}% - 18px)` }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-background/80 shadow-[0_0_28px_-6px_hsl(190_90%_55%)]">
              <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-pulse" />
              <Zap className="relative h-4 w-4 text-cyan-300" />
            </div>
          </div>

          {turns.map((turn, index) => {
            const answered = turn.answered;
            return (
              <button
                key={turn.id}
                type="button"
                onClick={() => onJump?.(turn.id)}
                className="group relative w-[220px] shrink-0 text-left animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 80, 400)}ms` }}
              >
                <div className="mb-5 flex justify-center">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute top-8 h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
                    <div
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300",
                        answered
                          ? "border-cyan-400/50 bg-gradient-to-br from-violet-500/30 to-cyan-400/20 shadow-[0_0_30px_-8px_hsl(190_90%_55%)] group-hover:scale-105"
                          : "border-white/15 bg-background/70 group-hover:border-violet-400/40"
                      )}
                    >
                      {answered ? (
                        <Sparkles className="h-5 w-5 text-cyan-300" />
                      ) : (
                        <Flag className="h-5 w-5 text-violet-300" />
                      )}
                    </div>
                    <div className="mt-2 text-center text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
                      Stage {index + 1}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-300",
                    answered
                      ? "border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-background/70 group-hover:border-cyan-300/60 group-hover:-translate-y-1"
                      : "border-white/10 bg-background/60 group-hover:border-violet-400/30 group-hover:-translate-y-1"
                  )}
                >
                  <div className="text-xs font-semibold leading-snug text-foreground line-clamp-2">
                    {turn.question}
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                    {turn.answer || "Question locked in. FLOW is preparing the next reveal."}
                  </div>
                </div>
              </button>
            );
          })}

          {asking && (
            <div className="relative w-[220px] shrink-0 animate-fade-in">
              <div className="mb-5 flex justify-center">
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-8 h-8 w-px bg-gradient-to-b from-violet-300/40 to-transparent" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/40 bg-violet-500/10 shadow-[0_0_30px_-10px_hsl(263_70%_60%)]">
                    <span className="absolute inset-0 rounded-2xl bg-violet-400/15 animate-pulse" />
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-300 animate-ping" />
                  </div>
                  <div className="mt-2 text-center text-[10px] font-mono uppercase tracking-[0.18em] text-violet-300/80">
                    Next stage
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-violet-400/30 bg-background/60 px-4 py-3 backdrop-blur-xl">
                <div className="text-xs font-semibold text-violet-200">FLOW is forging the next path</div>
                <div className="mt-2 flex gap-1">
                  <span className="h-1.5 w-6 rounded-full bg-violet-300/70 animate-pulse" />
                  <span className="h-1.5 w-6 rounded-full bg-fuchsia-300/70 animate-pulse [animation-delay:140ms]" />
                  <span className="h-1.5 w-6 rounded-full bg-cyan-300/70 animate-pulse [animation-delay:280ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}