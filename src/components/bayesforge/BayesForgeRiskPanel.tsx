import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskFactor {
  name: string;
  category: string;
  severity: number;
  likelihood: number;
  score: number;
  mitigation: string;
}

interface RiskData {
  overallScore: number;
  factors: RiskFactor[];
}

const CAT_META: Record<string, { hex: string; tw: string; glow: string; label: string }> = {
  market: { hex: "#a855f7", tw: "from-violet-500 to-fuchsia-500", glow: "263 90% 65%", label: "Market" },
  financial: { hex: "#10d9a3", tw: "from-emerald-400 to-teal-500", glow: "160 85% 50%", label: "Financial" },
  environmental: { hex: "#fbbf24", tw: "from-amber-400 to-orange-500", glow: "42 95% 55%", label: "Environmental" },
  technical: { hex: "#38bdf8", tw: "from-cyan-400 to-sky-500", glow: "200 95% 60%", label: "Technical" },
  regulatory: { hex: "#fb7185", tw: "from-rose-400 to-pink-500", glow: "350 90% 65%", label: "Regulatory" },
  operational: { hex: "#c084fc", tw: "from-purple-400 to-indigo-500", glow: "270 90% 65%", label: "Operational" },
};
const metaFor = (c: string) =>
  CAT_META[c] ?? { hex: "#94a3b8", tw: "from-slate-400 to-slate-500", glow: "215 20% 65%", label: c };

export default function BayesForgeRiskPanel({ data }: { data: RiskData }) {
  const [openFactor, setOpenFactor] = useState<number | null>(0);

  const sorted = useMemo(
    () => [...data.factors].sort((a, b) => b.score - a.score),
    [data.factors],
  );

  const tone = useMemo(() => {
    if (data.overallScore >= 70)
      return { label: "Critical Risk", text: "text-rose-300", from: "from-rose-500", to: "to-pink-500", glow: "350 90% 60%", icon: AlertTriangle };
    if (data.overallScore >= 40)
      return { label: "Moderate Risk", text: "text-amber-300", from: "from-amber-500", to: "to-orange-500", glow: "40 90% 55%", icon: AlertTriangle };
    return { label: "Low Risk", text: "text-emerald-300", from: "from-emerald-500", to: "to-teal-500", glow: "150 80% 50%", icon: Shield };
  }, [data.overallScore]);
  const ToneIcon = tone.icon;

  // Risk matrix cells
  const matrixFactors = (sev: number, lik: number) =>
    sorted.filter((f) => f.severity === sev && f.likelihood === lik);

  const cellTone = (s: number, l: number) => {
    const score = s * l;
    if (score >= 20) return { bg: "bg-rose-500/30", border: "border-rose-400/40", text: "text-rose-200" };
    if (score >= 12) return { bg: "bg-amber-500/25", border: "border-amber-400/35", text: "text-amber-200" };
    if (score >= 6) return { bg: "bg-yellow-500/15", border: "border-yellow-400/25", text: "text-yellow-200" };
    return { bg: "bg-emerald-500/15", border: "border-emerald-400/25", text: "text-emerald-200" };
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ===== TOP: Overall + Matrix ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Overall */}
        <div className="lg:col-span-2 relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <ToneIcon className={cn("h-3.5 w-3.5", tone.text)} />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Overall Risk Posture
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-end gap-3">
              <div
                className={cn("text-6xl font-bold tabular-nums leading-none", tone.text)}
                style={{ filter: `drop-shadow(0 0 16px hsl(${tone.glow}))` }}
              >
                {data.overallScore}
              </div>
              <div className="text-sm text-muted-foreground pb-1.5">/ 100</div>
            </div>
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-gradient-to-r text-white",
                tone.from,
                tone.to,
              )}
              style={{ boxShadow: `0 0 18px -4px hsl(${tone.glow})` }}
            >
              {tone.label}
            </span>

            {/* Distribution by severity tier */}
            <div className="space-y-2 pt-2">
              {[
                { tier: "Critical (≥20)", min: 20, color: "from-rose-500 to-pink-500", glow: "350 90% 60%" },
                { tier: "High (12-19)", min: 12, max: 19, color: "from-amber-500 to-orange-400", glow: "40 90% 55%" },
                { tier: "Medium (6-11)", min: 6, max: 11, color: "from-yellow-400 to-amber-400", glow: "55 90% 55%" },
                { tier: "Low (<6)", max: 5, color: "from-emerald-500 to-teal-400", glow: "150 80% 50%" },
              ].map((t) => {
                const count = sorted.filter((f) => {
                  const min = t.min ?? 0;
                  const max = t.max ?? 99;
                  return f.score >= min && f.score <= max;
                }).length;
                const pct = sorted.length ? (count / sorted.length) * 100 : 0;
                return (
                  <div key={t.tier}>
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                      <span>{t.tier}</span>
                      <span className="text-foreground/80">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-700", t.color)}
                        style={{
                          width: `${pct}%`,
                          boxShadow: `0 0 8px hsl(${t.glow})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="lg:col-span-3 relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-cyan-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              5×5 Severity / Likelihood Matrix
            </span>
          </div>
          <div className="p-4">
            <div className="flex">
              {/* Y axis label */}
              <div className="flex flex-col items-center justify-center pr-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground rotate-180 [writing-mode:vertical-rl]">
                  Likelihood →
                </div>
              </div>
              {/* Grid */}
              <div className="flex-1 grid grid-cols-6 gap-1">
                <div />
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={`h-${s}`} className="text-center text-[10px] font-mono text-muted-foreground">
                    S{s}
                  </div>
                ))}
                {[5, 4, 3, 2, 1].map((l) => (
                  <div key={`row-${l}`} className="contents">
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-center">
                      L{l}
                    </div>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const factors = matrixFactors(s, l);
                      const t = cellTone(s, l);
                      return (
                        <div
                          key={`${s}-${l}`}
                          className={cn(
                            "aspect-square rounded-md border flex items-center justify-center relative transition-all hover:scale-105",
                            t.bg,
                            t.border,
                          )}
                          title={
                            factors.length
                              ? factors.map((f) => f.name).join(", ")
                              : `Score: ${s * l}`
                          }
                        >
                          {factors.length > 0 ? (
                            <div className="relative">
                              <div
                                className={cn(
                                  "h-3 w-3 rounded-full bg-foreground animate-pulse",
                                  t.text,
                                )}
                                style={{
                                  background: "currentColor",
                                  boxShadow: "0 0 10px currentColor",
                                }}
                              />
                              {factors.length > 1 && (
                                <span className="absolute -top-1 -right-2 text-[8px] font-bold tabular-nums text-foreground/80">
                                  {factors.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[8px] font-mono text-foreground/30">
                              {s * l}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-2">
              Severity →
            </div>
          </div>
        </div>
      </div>

      {/* ===== Factor list (expandable) ===== */}
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_-15px_hsl(var(--primary)/0.4)]">
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-rose-300" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Risk Factors · Ranked by Score
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {sorted.length} factors
          </span>
        </div>
        <div className="p-3 space-y-2">
          {sorted.map((f, i) => {
            const m = metaFor(f.category);
            const open = openFactor === i;
            const scoreTone =
              f.score >= 20
                ? { bg: "from-rose-500 to-pink-500", glow: "350 90% 60%" }
                : f.score >= 12
                ? { bg: "from-amber-500 to-orange-500", glow: "40 90% 55%" }
                : { bg: "from-emerald-500 to-teal-500", glow: "150 80% 50%" };
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border transition-all overflow-hidden",
                  open
                    ? "border-white/20 bg-white/5"
                    : "border-white/5 bg-background/40 hover:bg-background/60 hover:border-white/15",
                )}
                style={open ? { boxShadow: `0 0 18px -4px hsl(${scoreTone.glow})` } : undefined}
              >
                <button
                  onClick={() => setOpenFactor(open ? null : i)}
                  className="w-full p-3 flex items-center gap-3 text-left"
                >
                  <div
                    className={cn(
                      "h-11 w-11 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br",
                      scoreTone.bg,
                    )}
                    style={{ boxShadow: `0 0 12px -2px hsl(${scoreTone.glow})` }}
                  >
                    {f.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm truncate">{f.name}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider text-white bg-gradient-to-r",
                          m.tw,
                        )}
                      >
                        {m.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span>Severity: <span className="text-foreground/80">{f.severity}/5</span></span>
                      <span>Likelihood: <span className="text-foreground/80">{f.likelihood}/5</span></span>
                      <span>Risk Score: <span className="text-foreground/80">{f.score}/25</span></span>
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {open && (
                  <div className="px-3 pb-3 space-y-3 animate-fade-in">
                    {/* Sev / Lik bars */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                          Severity
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              className={cn(
                                "h-2 flex-1 rounded-full",
                                n <= f.severity ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-white/5",
                              )}
                              style={
                                n <= f.severity
                                  ? { boxShadow: "0 0 6px hsl(263 90% 65%)" }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                          Likelihood
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              className={cn(
                                "h-2 flex-1 rounded-full",
                                n <= f.likelihood ? "bg-gradient-to-r from-cyan-400 to-sky-500" : "bg-white/5",
                              )}
                              style={
                                n <= f.likelihood
                                  ? { boxShadow: "0 0 6px hsl(200 95% 60%)" }
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Mitigation */}
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 mb-1 flex items-center gap-1.5">
                        <Shield className="h-3 w-3" />
                        Mitigation Strategy
                      </div>
                      <p className="text-xs text-foreground/85 leading-relaxed">
                        {f.mitigation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
