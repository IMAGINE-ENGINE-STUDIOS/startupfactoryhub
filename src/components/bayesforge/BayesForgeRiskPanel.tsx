import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield } from "lucide-react";

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

export default function BayesForgeRiskPanel({ data }: { data: RiskData }) {
  const riskColor = data.overallScore >= 70 ? "text-red-500" : data.overallScore >= 40 ? "text-amber-500" : "text-emerald-500";
  const riskLabel = data.overallScore >= 70 ? "High Risk" : data.overallScore >= 40 ? "Moderate Risk" : "Low Risk";

  const sortedFactors = [...data.factors].sort((a, b) => b.score - a.score);

  const severityColor = (score: number) => {
    if (score >= 20) return "bg-red-500/20 text-red-500 border-red-500/30";
    if (score >= 12) return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center space-y-2">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${data.overallScore >= 50 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
          {data.overallScore >= 50 ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <Shield className="h-5 w-5 text-emerald-500" />}
          <span className={`text-lg font-bold ${riskColor}`}>{riskLabel}</span>
        </div>
        <div className={`text-4xl font-bold ${riskColor}`}>{data.overallScore}/100</div>
      </div>

      {/* Risk Matrix Heatmap */}
      <Card className="tech-card border-0">
        <CardHeader className="pb-3"><CardTitle className="text-base">Risk Matrix</CardTitle></CardHeader>
        <CardContent>
          <div className="relative">
            <div className="grid grid-cols-6 gap-0.5">
              <div className="col-span-1" />
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="text-center text-[10px] text-muted-foreground py-1">S{s}</div>
              ))}
              {[5, 4, 3, 2, 1].map(l => (
                <>
                  <div key={`l-${l}`} className="text-[10px] text-muted-foreground flex items-center justify-center">L{l}</div>
                  {[1, 2, 3, 4, 5].map(s => {
                    const score = s * l;
                    const hasFactors = sortedFactors.filter(f => f.severity === s && f.likelihood === l);
                    const bg = score >= 20 ? "bg-red-500/40" : score >= 12 ? "bg-amber-500/30" : score >= 6 ? "bg-yellow-500/20" : "bg-emerald-500/15";
                    return (
                      <div
                        key={`${s}-${l}`}
                        className={`aspect-square rounded ${bg} flex items-center justify-center text-[10px] font-medium relative`}
                        title={hasFactors.map(f => f.name).join(", ") || `Score: ${score}`}
                      >
                        {hasFactors.length > 0 && (
                          <div className="w-3 h-3 rounded-full bg-foreground/80 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-8">
              <span>← Low Severity</span><span>High Severity →</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factor Breakdown */}
      <div className="space-y-3">
        {sortedFactors.map((f, i) => (
          <Card key={i} className="tech-card border-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{f.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColor(f.score)}`}>
                      {f.score}/25
                    </span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full capitalize">{f.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.mitigation}</p>
                </div>
                <div className="text-right text-[10px] text-muted-foreground space-y-0.5 shrink-0">
                  <div>Sev: {f.severity}/5</div>
                  <div>Lik: {f.likelihood}/5</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
