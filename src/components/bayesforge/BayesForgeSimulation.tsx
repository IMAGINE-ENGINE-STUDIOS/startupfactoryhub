import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  Layers,
  Sparkles,
  ArrowRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationData {
  feasibilityScore: number;
  confidenceInterval: [number, number];
  revenueProjections: {
    year1: { low: number; mid: number; high: number };
    year2: { low: number; mid: number; high: number };
    year3: { low: number; mid: number; high: number };
  };
  scenarios: Array<{
    name: string;
    probability: number;
    outcome: string;
    revenue: number;
  }>;
  monteCarloDistribution: Array<{ bucket: string; frequency: number }>;
}

const fmtCurrency = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n}`;

export default function BayesForgeSimulation({ data }: { data: SimulationData }) {
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  const maxFreq = Math.max(...data.monteCarloDistribution.map((d) => d.frequency), 1);
  const totalFreq = data.monteCarloDistribution.reduce((a, b) => a + b.frequency, 0) || 1;

  const score = data.feasibilityScore;
  const scoreTone = useMemo(() => {
    if (score >= 70)
      return {
        label: "Strong",
        text: "text-emerald-300",
        from: "from-emerald-500",
        to: "to-teal-400",
        glow: "150 80% 50%",
      };
    if (score >= 40)
      return {
        label: "Moderate",
        text: "text-amber-300",
        from: "from-amber-500",
        to: "to-orange-400",
        glow: "40 90% 55%",
      };
    return {
      label: "Weak",
      text: "text-rose-300",
      from: "from-rose-500",
      to: "to-pink-500",
      glow: "350 90% 60%",
    };
  }, [score]);

  // Gauge math (semicircle)
  const gaugeR = 90;
  const gaugeC = Math.PI * gaugeR;
  const dash = (score / 100) * gaugeC;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ====== TOP: Feasibility gauge + Revenue ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Feasibility */}
        <div className="lg:col-span-2 relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-violet-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Feasibility Index
            </span>
          </div>
          <div className="p-5 flex flex-col items-center">
            <div className="relative">
              <svg viewBox="0 0 220 130" className="w-[220px] h-[130px]">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" x2="1">
                    <stop offset="0%" stopColor={`hsl(${scoreTone.glow})`} stopOpacity="1" />
                    <stop offset="100%" stopColor="hsl(263 90% 70%)" stopOpacity="1" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <path
                  d={`M 20 110 A ${gaugeR} ${gaugeR} 0 0 1 200 110`}
                  fill="none"
                  stroke="hsl(var(--foreground) / 0.08)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Value */}
                <path
                  d={`M 20 110 A ${gaugeR} ${gaugeR} 0 0 1 200 110`}
                  fill="none"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${gaugeC}`}
                  style={{
                    filter: `drop-shadow(0 0 8px hsl(${scoreTone.glow}))`,
                    transition: "stroke-dasharray 1s ease-out",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <div
                  className={cn("text-5xl font-bold tabular-nums", scoreTone.text)}
                  style={{ filter: `drop-shadow(0 0 12px hsl(${scoreTone.glow}))` }}
                >
                  {score}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  / 100
                </div>
              </div>
            </div>
            <span
              className={cn(
                "mt-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-gradient-to-r text-white",
                scoreTone.from,
                scoreTone.to,
              )}
              style={{ boxShadow: `0 0 18px -4px hsl(${scoreTone.glow})` }}
            >
              {scoreTone.label} viability
            </span>
            <div className="mt-3 w-full">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex justify-between mb-1">
                <span>Confidence Interval (95%)</span>
                <span className="text-foreground/80">
                  {data.confidenceInterval[0]}% – {data.confidenceInterval[1]}%
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-violet-500/70 via-cyan-400/70 to-emerald-400/70 rounded-full"
                  style={{
                    left: `${data.confidenceInterval[0]}%`,
                    right: `${100 - data.confidenceInterval[1]}%`,
                    boxShadow: "0 0 10px hsl(263 90% 60%)",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-1 rounded bg-white"
                  style={{ left: `${score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Projections */}
        <div className="lg:col-span-3 relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Revenue Trajectory · 3-Year
            </span>
          </div>
          <div className="p-4 space-y-3">
            {(["year1", "year2", "year3"] as const).map((yr, i) => {
              const p = data.revenueProjections[yr];
              const overallMax = Math.max(
                data.revenueProjections.year1.high,
                data.revenueProjections.year2.high,
                data.revenueProjections.year3.high,
                1,
              );
              const lowPct = (p.low / overallMax) * 100;
              const midPct = (p.mid / overallMax) * 100;
              const highPct = (p.high / overallMax) * 100;
              return (
                <div
                  key={yr}
                  className="group p-3 rounded-xl border border-white/5 bg-background/40 hover:border-white/15 hover:bg-background/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                        Y{i + 1}
                      </span>
                      <span className="text-xs font-semibold">Year {i + 1}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="text-rose-300">L {fmtCurrency(p.low)}</span>
                      <span className="text-cyan-200 font-bold text-xs">
                        M {fmtCurrency(p.mid)}
                      </span>
                      <span className="text-emerald-300">H {fmtCurrency(p.high)}</span>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                    {/* range low->high */}
                    <div
                      className="absolute h-full bg-gradient-to-r from-rose-500/40 via-cyan-400/60 to-emerald-400/60 rounded-full"
                      style={{
                        left: `${lowPct}%`,
                        width: `${highPct - lowPct}%`,
                        boxShadow: "0 0 12px hsl(190 90% 55% / 0.5)",
                      }}
                    />
                    {/* mid marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 w-1 rounded bg-white"
                      style={{
                        left: `${midPct}%`,
                        boxShadow: "0 0 8px white",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== BOTTOM: Monte Carlo + Scenarios ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monte Carlo */}
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Monte Carlo Distribution
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {data.monteCarloDistribution.length} buckets · 10k runs
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1" style={{ height: 180 }}>
              {data.monteCarloDistribution.map((d, i) => {
                const heightPct = (d.frequency / maxFreq) * 100;
                const isHover = hoverBar === i;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end h-full relative group"
                    onMouseEnter={() => setHoverBar(i)}
                    onMouseLeave={() => setHoverBar(null)}
                  >
                    {isHover && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur border border-white/15 rounded px-2 py-1 text-[10px] font-mono whitespace-nowrap shadow-lg">
                        {d.bucket}
                        <br />
                        <span className="text-cyan-300">{d.frequency}%</span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-full rounded-t-md bg-gradient-to-t transition-all duration-300",
                        isHover
                          ? "from-cyan-400 via-violet-400 to-fuchsia-400"
                          : "from-violet-500/70 via-violet-400/60 to-cyan-400/70",
                      )}
                      style={{
                        height: `${heightPct}%`,
                        minHeight: 4,
                        boxShadow: isHover
                          ? "0 0 14px hsl(263 90% 65%)"
                          : "0 0 6px hsl(263 90% 60% / 0.4)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-1.5">
              {data.monteCarloDistribution.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[8px] text-muted-foreground/70 leading-none block truncate">
                    {d.bucket}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <Activity className="h-3 w-3" />
              Total mass: {totalFreq}% · Peak bucket: {
                data.monteCarloDistribution.reduce(
                  (best, d) => (d.frequency > best.frequency ? d : best),
                  data.monteCarloDistribution[0],
                ).bucket
              }
            </div>
          </div>
        </div>

        {/* Scenarios */}
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-fuchsia-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Scenario Tree · {data.scenarios.length} branches
            </span>
          </div>
          <div className="p-3 space-y-2 max-h-[260px] overflow-auto">
            {data.scenarios.map((s, i) => {
              const isActive = activeScenario === i;
              const probColor =
                s.probability >= 0.5
                  ? "263 90% 65%"
                  : s.probability >= 0.25
                  ? "190 90% 55%"
                  : "215 20% 65%";
              return (
                <button
                  key={i}
                  onClick={() => setActiveScenario(isActive ? null : i)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all group",
                    isActive
                      ? "border-white/25 bg-white/5"
                      : "border-white/5 bg-background/40 hover:bg-background/60 hover:border-white/15",
                  )}
                  style={
                    isActive
                      ? { boxShadow: `0 0 18px -4px hsl(${probColor})` }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="relative h-12 w-12 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-violet-500 to-cyan-500"
                      style={{ boxShadow: `0 0 12px -2px hsl(${probColor})` }}
                    >
                      {(s.probability * 100).toFixed(0)}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">
                          {s.name}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="text-xs font-mono text-emerald-300 shrink-0">
                          {fmtCurrency(s.revenue)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-[11px] text-muted-foreground leading-relaxed",
                          isActive ? "" : "line-clamp-2",
                        )}
                      >
                        {s.outcome}
                      </p>
                    </div>
                  </div>
                  {/* Probability bar */}
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-all duration-700"
                      style={{
                        width: `${s.probability * 100}%`,
                        boxShadow: `0 0 8px hsl(${probColor})`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
