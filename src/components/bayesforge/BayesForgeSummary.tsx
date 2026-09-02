import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

interface Props {
  data: {
    network: { nodes: any[]; edges: any[] };
    simulation: any;
    risk: any;
    logic: { rules: any[]; algorithmSchema: string; summary: string };
  };
  idea: string;
  domain: string;
  region: string;
}

function verdict(score: number) {
  if (score >= 75)
    return {
      label: "Strong",
      plain: "The model thinks this idea works if you keep executing.",
      tone: "text-emerald-300",
      ring: "from-emerald-400 to-cyan-400",
    };
  if (score >= 55)
    return {
      label: "Promising",
      plain: "It can work, but a couple of things must go right first.",
      tone: "text-cyan-300",
      ring: "from-cyan-400 to-violet-400",
    };
  if (score >= 35)
    return {
      label: "Fragile",
      plain: "Too much depends on assumptions you have not proven yet.",
      tone: "text-amber-300",
      ring: "from-amber-400 to-orange-400",
    };
  return {
    label: "High risk",
    plain: "As modelled today, this is more likely to fail than succeed.",
    tone: "text-rose-300",
    ring: "from-rose-400 to-fuchsia-400",
  };
}

function likelihoodWord(p: number) {
  if (p >= 0.8) return "very likely";
  if (p >= 0.6) return "likely";
  if (p >= 0.4) return "a coin flip";
  if (p >= 0.2) return "unlikely";
  return "very unlikely";
}

/**
 * Plain-language view of the Bayesian analysis.
 * Same numbers as the technical tabs, explained in normal words.
 */
export default function BayesForgeSummary({ data, idea, domain, region }: Props) {
  const score = Number(data?.simulation?.feasibilityScore ?? 0);
  const v = verdict(score);
  const nodes = data?.network?.nodes ?? [];
  const edges = data?.network?.edges ?? [];
  const riskScore = Number(data?.risk?.overallScore ?? 0);

  const label = (id: string) => nodes.find((n: any) => n.id === id)?.label || id;

  const drivers = [...edges]
    .sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 3);

  const weakest = [...nodes]
    .sort((a: any, b: any) => (a.probability ?? 0) - (b.probability ?? 0))
    .slice(0, 3);

  const topRisks = [...(data?.risk?.factors ?? [])]
    .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Verdict */}
      <div className="tech-card border-0 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 mx-auto sm:mx-0">
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-br opacity-25 blur-lg",
                v.ring,
              )}
            />
            <div className="relative h-24 w-24 rounded-full border border-white/10 bg-background/60 flex flex-col items-center justify-center">
              <span className={cn("text-2xl font-bold", v.tone)}>{score}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                out of 100
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Verdict
              </span>
            </div>
            <h3 className={cn("text-xl font-semibold", v.tone)}>{v.label}</h3>
            <p className="text-sm text-muted-foreground">{v.plain}</p>
            <p className="text-xs text-muted-foreground/80">
              Based on “{idea}”{domain ? ` · ${domain}` : ""}
              {region ? ` · ${region}` : ""} — risk level {riskScore}/100.
            </p>
          </div>
        </div>
      </div>

      {/* What has to go right */}
      <div className="tech-card border-0 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-300" />
          <h4 className="text-sm font-semibold">What has to go right</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          These are the strongest cause-and-effect links the model found. Read them
          as: fix the first thing, and the second improves.
        </p>
        <ul className="space-y-2">
          {drivers.map((e: any, i: number) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2 text-sm"
            >
              <span className="font-medium">{label(e.from)}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{label(e.to)}</span>
              <span className="text-xs text-muted-foreground">
                — {Math.round((e.weight ?? 0) * 100)}% influence
                {e.relationship ? `: ${e.relationship}` : ""}
              </span>
            </li>
          ))}
          {drivers.length === 0 && (
            <li className="text-sm text-muted-foreground">No dependencies modelled.</li>
          )}
        </ul>
      </div>

      {/* Weakest assumptions */}
      <div className="tech-card border-0 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-300" />
          <h4 className="text-sm font-semibold">Your weakest assumptions</h4>
        </div>
        <ul className="space-y-2">
          {weakest.map((n: any) => (
            <li key={n.id} className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{n.label}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {Math.round((n.probability ?? 0) * 100)}% — {likelihoodWord(n.probability ?? 0)}
                </span>
              </div>
              {n.description && (
                <p className="text-xs text-muted-foreground mt-1">{n.description}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Biggest risks */}
      <div className="tech-card border-0 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-300" />
          <h4 className="text-sm font-semibold">Biggest risks and what to do</h4>
        </div>
        <ul className="space-y-2">
          {topRisks.map((f: any, i: number) => (
            <li key={i} className="rounded-xl border border-white/10 bg-background/40 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {f.score}/25
                </span>
              </div>
              {f.mitigation && (
                <p className="text-xs text-muted-foreground mt-1 flex gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300 mt-[1px]" />
                  {f.mitigation}
                </p>
              )}
            </li>
          ))}
          {topRisks.length === 0 && (
            <li className="text-sm text-muted-foreground">No risks modelled.</li>
          )}
        </ul>
      </div>

      {data?.logic?.summary && (
        <div className="tech-card border-0 rounded-2xl p-5">
          <h4 className="text-sm font-semibold mb-1.5">In one paragraph</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.logic.summary}
          </p>
        </div>
      )}
    </div>
  );
}
