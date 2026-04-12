import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  const maxFreq = Math.max(...data.monteCarloDistribution.map(d => d.frequency));
  const formatCurrency = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  const scoreColor = data.feasibilityScore >= 70 ? "text-emerald-500" : data.feasibilityScore >= 40 ? "text-amber-500" : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Feasibility Score */}
      <div className="text-center space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Feasibility Score</h3>
        <div className={`text-5xl font-bold ${scoreColor}`}>{data.feasibilityScore}</div>
        <div className="text-xs text-muted-foreground">
          Confidence: {data.confidenceInterval[0]}% – {data.confidenceInterval[1]}%
        </div>
        <Progress value={data.feasibilityScore} className="h-3 max-w-xs mx-auto" />
      </div>

      {/* Revenue Projections */}
      <Card className="tech-card border-0">
        <CardHeader className="pb-3"><CardTitle className="text-base">Revenue Projections</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(["year1", "year2", "year3"] as const).map((yr, i) => {
              const p = data.revenueProjections[yr];
              return (
                <div key={yr} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-16">Year {i + 1}</span>
                  <div className="flex-1 flex items-center gap-2 text-xs">
                    <span className="text-red-400 w-16 text-right">{formatCurrency(p.low)}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full relative overflow-hidden">
                      <div className="absolute inset-y-0 bg-gradient-to-r from-red-400/40 via-emerald-500/60 to-emerald-400/40 rounded-full"
                        style={{ left: `${(p.low / p.high) * 100 * 0.3}%`, right: "0%" }} />
                    </div>
                    <span className="text-emerald-400 w-16">{formatCurrency(p.high)}</span>
                  </div>
                  <span className="text-sm font-semibold w-20 text-right">{formatCurrency(p.mid)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monte Carlo Distribution */}
      <Card className="tech-card border-0">
        <CardHeader className="pb-3"><CardTitle className="text-base">Monte Carlo Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {data.monteCarloDistribution.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/60 rounded-t hover:bg-primary/80 transition-colors"
                  style={{ height: `${(d.frequency / maxFreq) * 100}%` }}
                  title={`${d.bucket}: ${d.frequency}%`}
                />
                <span className="text-[8px] text-muted-foreground rotate-[-45deg] origin-top-left w-12 truncate">{d.bucket}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Card className="tech-card border-0">
        <CardHeader className="pb-3"><CardTitle className="text-base">Scenario Analysis</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.scenarios.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-primary w-12 text-center">{(s.probability * 100).toFixed(0)}%</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{s.name}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.outcome}</p>
                </div>
                <div className="text-sm font-semibold text-right">{formatCurrency(s.revenue)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
