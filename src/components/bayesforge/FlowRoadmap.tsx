import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import {
  Flag,
  Lock,
  MapPin,
  Plus,
  Rocket,
  Trophy,
  Zap,
  Target,
  Loader2,
  X,
  Compass,
} from "lucide-react";
import type { FlowMessage, FlowSessionApi } from "@/hooks/useFlowSession";
import { Input } from "@/components/ui/input";

interface Props {
  api: FlowSessionApi;
  /** Optional callback when a milestone is opened/inspected */
  onJump?: (id: string) => void;
}

type Turn = {
  id: string;
  question: string;
  answer?: string;
  answered: boolean;
};

const SUGGESTED_QUESTS = [
  "What's the #1 risk to mitigate first?",
  "Which 2 variables would lift feasibility most?",
  "Compare against top competitors.",
  "Draft a 90-day action plan.",
  "Where will I lose money fastest?",
  "What proves product-market fit?",
];

/**
 * Gamified horizontal roadmap. Each answered question = a conquered checkpoint.
 * Adding a question = placing a new milestone marker on the path.
 * NO chat bubbles. NO chat input. Looks like a quest map.
 */
export default function FlowRoadmap({ api, onJump }: Props) {
  const { messages, asking, askQuestion, sessionId } = api;
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const turns: Turn[] = useMemo(() => {
    const paired: Turn[] = [];
    for (let i = 0; i < messages.length; i++) {
      const cur = messages[i];
      if (cur.role !== "user") continue;
      const next = messages[i + 1];
      const answer = next?.role === "assistant" ? next : undefined;
      paired.push({
        id: cur.id,
        question: cur.content,
        answer: answer?.content,
        answered: !!answer,
      });
      if (answer) i += 1;
    }
    return paired;
  }, [messages]);

  const cleared = turns.filter((t) => t.answered).length;
  const total = Math.max(turns.length, 1);
  const progress = Math.min(100, (cleared / total) * 100);

  // Auto-scroll right on new milestone / answer
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [turns.length, asking, adding]);

  // Auto-open the latest answered turn briefly
  useEffect(() => {
    const last = turns[turns.length - 1];
    if (last?.answered) setOpenId(last.id);
  }, [turns.length, turns[turns.length - 1]?.answered]);

  const submit = () => {
    const q = draft.trim();
    if (!q || asking || !sessionId) return;
    setDraft("");
    setAdding(false);
    askQuestion(q);
    onJump?.(q);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      setAdding(false);
      setDraft("");
    }
  };

  const startAdd = (preset?: string) => {
    if (!sessionId) return;
    setAdding(true);
    if (preset) setDraft(preset);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  // Compute a wavy SVG path across milestones
  const STAGE_W = 260;
  const PATH_HEIGHT = 120;
  const stageCount = turns.length + 1; // +1 for "next" / add slot
  const totalWidth = Math.max(stageCount * STAGE_W + 120, 800);

  const buildPath = () => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < stageCount; i++) {
      const x = 80 + i * STAGE_W;
      const y = PATH_HEIGHT / 2 + Math.sin(i * 1.1) * 28;
      points.push({ x, y });
    }
    if (points.length === 0) return { d: "", points };
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cx = (prev.x + cur.x) / 2;
      d += ` Q ${cx} ${prev.y}, ${cx} ${(prev.y + cur.y) / 2} T ${cur.x} ${cur.y}`;
    }
    return { d, points };
  };

  const { d: pathD, points } = buildPath();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-b from-background/70 via-background/50 to-background/70 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* Header HUD */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 bg-background/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inset-0 rounded-md bg-gradient-to-br from-violet-500 to-cyan-400 blur-md opacity-60" />
            <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-cyan-400">
              <Compass className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-violet-200">
              Investigation Roadmap
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/70">
              Place a marker · Conquer the path · Build your map
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-background/40 px-2.5 py-1">
            <Trophy className="h-3 w-3 text-amber-300" />
            <span className="text-[10px] font-mono text-amber-200">
              {cleared} / {turns.length || 0} cleared
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1">
            <Zap className="h-3 w-3 text-cyan-300" />
            <span className="text-[10px] font-mono text-cyan-200">XP {cleared * 100}</span>
          </div>
        </div>
      </div>

      {/* PATH / TRACK */}
      <div ref={trackRef} className="relative overflow-x-auto [scrollbar-width:thin]">
        <div
          className="relative"
          style={{ width: `${totalWidth}px`, minHeight: "320px" }}
        >
          {/* Decorative grid floor */}
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,hsl(var(--primary)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.18)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />

          {/* SVG path */}
          <svg
            className="absolute left-0 top-[60px] pointer-events-none"
            width={totalWidth}
            height={PATH_HEIGHT}
            viewBox={`0 0 ${totalWidth} ${PATH_HEIGHT}`}
          >
            <defs>
              <linearGradient id="rmPathBase" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(263 70% 60% / 0.25)" />
                <stop offset="100%" stopColor="hsl(190 90% 55% / 0.25)" />
              </linearGradient>
              <linearGradient id="rmPathFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(263 90% 65%)" />
                <stop offset="50%" stopColor="hsl(295 90% 65%)" />
                <stop offset="100%" stopColor="hsl(190 95% 60%)" />
              </linearGradient>
              <filter id="rmGlow">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            {/* dashed background path */}
            <path
              d={pathD}
              stroke="url(#rmPathBase)"
              strokeWidth={6}
              fill="none"
              strokeDasharray="2 10"
              strokeLinecap="round"
            />
            {/* progress overlay path (clipped by progress %) */}
            <g
              style={{
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
                transition: "clip-path 700ms ease-out",
              }}
            >
              <path
                d={pathD}
                stroke="url(#rmPathFill)"
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                filter="url(#rmGlow)"
              />
              <path
                d={pathD}
                stroke="url(#rmPathFill)"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
            </g>
            {/* traveling pulse */}
            {points.length > 0 && (
              <circle
                cx={(points[0].x + (points[points.length - 1].x - points[0].x) * (progress / 100)) || points[0].x}
                cy={
                  points.reduce((acc, p, i) => {
                    const ratio = i / Math.max(points.length - 1, 1);
                    const target = progress / 100;
                    return Math.abs(ratio - target) < 0.15 ? p.y : acc;
                  }, points[0].y)
                }
                r={6}
                fill="hsl(190 95% 70%)"
                style={{ transition: "all 700ms ease-out" }}
              >
                <animate attributeName="r" values="5;9;5" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.6;1" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>

          {/* MILESTONES (positioned over the path) */}
          {turns.map((turn, i) => {
            const p = points[i];
            if (!p) return null;
            const isOpen = openId === turn.id;
            return (
              <div
                key={turn.id}
                className="absolute"
                style={{ left: `${p.x - 40}px`, top: `${60 + p.y - 40}px`, width: "80px" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : turn.id)}
                  className={cn(
                    "group relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all duration-300 animate-scale-in",
                    turn.answered
                      ? "border-cyan-400/60 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-400/30 shadow-[0_0_40px_-8px_hsl(190_90%_55%)] hover:scale-110"
                      : "border-amber-400/50 bg-gradient-to-br from-amber-500/20 to-amber-400/10 shadow-[0_0_30px_-10px_hsl(40_90%_55%)] hover:scale-110"
                  )}
                  style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                >
                  {/* Stage number badge */}
                  <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-background/90 text-[10px] font-mono font-bold text-violet-200">
                    {i + 1}
                  </span>

                  {/* Status icon */}
                  {turn.answered ? (
                    <div className="relative">
                      <Trophy className="h-7 w-7 text-cyan-200 drop-shadow-[0_0_6px_hsl(190_95%_70%)]" />
                      <span className="absolute -inset-2 rounded-full bg-cyan-400/20 animate-ping" />
                    </div>
                  ) : (
                    <Loader2 className="h-7 w-7 text-amber-300 animate-spin" />
                  )}

                  {/* Hover hint */}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-background/80 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                    {turn.answered ? "View loot" : "In progress"}
                  </span>
                </button>

                {/* Reveal card */}
                {isOpen && (
                  <div
                    className={cn(
                      "absolute left-1/2 z-20 mt-3 w-[280px] -translate-x-1/2 rounded-2xl border bg-background/95 p-3 backdrop-blur-xl animate-fade-in",
                      turn.answered
                        ? "border-cyan-400/40 shadow-[0_10px_40px_-10px_hsl(190_90%_55%)]"
                        : "border-amber-400/40 shadow-[0_10px_40px_-10px_hsl(40_90%_55%)]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
                      <div className="flex-1 text-xs font-semibold leading-snug text-foreground">
                        {turn.question}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(null);
                        }}
                        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-white/10 bg-background/60 p-2.5 text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {turn.answer || (
                        <span className="italic text-amber-300/80">
                          FLOW is forging the answer…
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* NEXT / ADD MILESTONE slot at the end */}
          {(() => {
            const p = points[turns.length];
            if (!p) return null;
            return (
              <div
                className="absolute"
                style={{ left: `${p.x - 40}px`, top: `${60 + p.y - 40}px`, width: "80px" }}
              >
                {asking ? (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-violet-400/60 bg-violet-500/15 shadow-[0_0_40px_-8px_hsl(263_70%_60%)]">
                    <span className="absolute inset-0 rounded-2xl bg-violet-400/15 animate-pulse" />
                    <Rocket className="h-7 w-7 text-violet-200 animate-pulse" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startAdd()}
                    disabled={!sessionId}
                    className={cn(
                      "group relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300",
                      sessionId
                        ? "border-violet-400/50 bg-violet-500/5 hover:scale-110 hover:bg-violet-500/15 hover:shadow-[0_0_40px_-8px_hsl(263_70%_60%)]"
                        : "border-white/15 bg-background/30 opacity-50 cursor-not-allowed"
                    )}
                  >
                    {sessionId ? (
                      <>
                        <Plus className="h-8 w-8 text-violet-300 transition group-hover:rotate-90" />
                        <MapPin className="absolute -top-1 -right-1 h-4 w-4 text-fuchsia-300 animate-pulse" />
                      </>
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono uppercase tracking-wider text-violet-300/80">
                      {sessionId ? "Place marker" : "Run analysis"}
                    </span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* START FLAG */}
          {points[0] && (
            <div
              className="absolute pointer-events-none"
              style={{ left: `${points[0].x - 60}px`, top: `${60 + points[0].y - 14}px` }}
            >
              <div className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 backdrop-blur">
                <Flag className="h-3 w-3 text-emerald-300" />
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-200">
                  Start
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUEST COMPOSER (only visible while adding, not a chat bar) */}
      {adding && sessionId && (
        <div className="relative border-t border-violet-400/30 bg-gradient-to-b from-violet-500/10 to-background/60 p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-2.5">
            <MapPin className="h-3.5 w-3.5 text-fuchsia-300" />
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-fuchsia-200">
              Place a new milestone on the map
            </span>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
              className="ml-auto text-[10px] font-mono text-muted-foreground hover:text-foreground"
            >
              cancel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder="What do you want to investigate next?"
              className="h-11 bg-background/70 border-violet-400/30 focus-visible:ring-violet-400/50"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim() || asking}
              className={cn(
                "flex h-11 items-center gap-1.5 rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-all",
                "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/40 hover:shadow-violet-500/60",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <Rocket className="h-3.5 w-3.5" />
              Launch
            </button>
          </div>

          {/* Quick quest chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDraft(s)}
                className="rounded-full border border-white/10 bg-background/40 px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-violet-400/40 hover:bg-violet-500/10 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state CTA when no turns yet */}
      {!adding && turns.length === 0 && !asking && sessionId && (
        <div className="relative border-t border-white/10 px-4 py-3 flex items-center justify-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            Your map is empty —
          </span>
          <button
            type="button"
            onClick={() => startAdd()}
            className="flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-violet-200 hover:bg-violet-500/20 transition"
          >
            <Plus className="h-3 w-3" />
            Place first milestone
          </button>
        </div>
      )}
    </div>
  );
}
