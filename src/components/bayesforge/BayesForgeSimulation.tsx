import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Target, Layers } from "lucide-react";

interface SimulationData {
  feasibilityScore: number;
  confidenceInterval: [number, number];
  revenueProjections: {
    year1: { low: number; mid: number; high: number };
    year2: { low: number; mid: number; high: number };
    year3: { low: number; mid: number; high: number };
  };
  scenarios: Array<{ name: string; probability: number; outcome: string; revenue: number }>;
  monteCarloDistribution: Array<{ bucket: string; frequency: number }>;
}

export default function BayesForgeSimulation({ data }: { data: SimulationData }) {
  const maxFreq = Math.max(...data.monteCarloDistribution.map(d => d.frequency), 1);
  const formatCurrency = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const scoreColor = data.feasibilityScore >= 70 ? "text-emerald-500" : data.feasibilityScore >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="space-y-4">
      {/* Top row: Feasibility + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feasibility Score */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Feasibility Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${scoreColor}`}>{data.feasibilityScore}</div>
              <Progress value={data.feasibilityScore} className="h-2.5 max-w-[200px] mx-auto" />
              <div className="text-xs text-muted-foreground">
                Confidence: {data.confidenceInterval[0]}% – {data.confidenceInterval[1]}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Projections */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Projections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(["year1", "year2", "year3"] as const).map((yr, i) => {
                const p = data.revenueProjections[yr];
                return (
                  <div key={yr} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-12 shrink-0">Year {i + 1}</span>
                    <div className="flex-1 flex items-center gap-1.5 text-[10px]">
                      <span className="text-red-400 w-12 text-right shrink-0">{formatCurrency(p.low)}</span>
                      <div className="flex-1 h-2.5 bg-muted rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 bg-gradient-to-r from-red-400/40 via-emerald-500/60 to-emerald-400/40 rounded-full"
                          style={{ left: `${(p.low / p.high) * 100 * 0.3}%`, right: "0%" }} />
                      </div>
                      <span className="text-emerald-400 w-12 shrink-0">{formatCurrency(p.high)}</span>
                    </div>
                    <span className="text-xs font-semibold w-14 text-right shrink-0">{formatCurrency(p.mid)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Monte Carlo + Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monte Carlo Distribution */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Monte Carlo Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end gap-[3px]" style={{ height: "140px" }}>
                {data.monteCarloDistribution.map((d, i) => {
                  const heightPx = Math.max(4, (d.frequency / maxFreq) * 120);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-primary/60 rounded-t hover:bg-primary/80 transition-colors cursor-default"
                        style={{ height: `${heightPx}px` }}
                        title={`${d.bucket}: ${d.frequency}%`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-[3px]">
                {data.monteCarloDistribution.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[7px] text-muted-foreground leading-none block truncate" title={d.bucket}>
                      {d.bucket}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenarios */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Scenario Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 max-h-[200px] overflow-auto">
              {data.scenarios.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30">
                  <div className="text-base font-bold text-primary w-10 text-center shrink-0">{(s.probability * 100).toFixed(0)}%</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs">{s.name}</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{s.outcome}</p>
                  </div>
                  <div className="text-xs font-semibold text-right shrink-0">{formatCurrency(s.revenue)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
