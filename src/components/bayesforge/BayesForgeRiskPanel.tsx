import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Activity } from "lucide-react";

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
    <div className="space-y-4">
      {/* Top row: Score + Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overall Score */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {data.overallScore >= 50 ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <Shield className="h-4 w-4 text-emerald-500" />}
              Overall Risk
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${riskColor}`}>{data.overallScore}/100</div>
              <div className="space-y-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${data.overallScore >= 50 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                  <span className={`text-xs font-bold ${riskColor}`}>{riskLabel}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{sortedFactors.length} risk factors identified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Matrix */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Risk Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        className={`aspect-square rounded ${bg} flex items-center justify-center relative`}
                        title={hasFactors.map(f => f.name).join(", ") || `Score: ${score}`}
                      >
                        {hasFactors.length > 0 && (
                          <div className="w-2.5 h-2.5 rounded-full bg-foreground/80 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground px-6">
              <span>← Low Severity</span><span>High Severity →</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Factor Breakdown - 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {sortedFactors.map((f, i) => (
          <Card key={i} className="tech-card border-0">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <h4 className="font-semibold text-xs">{f.name}</h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${severityColor(f.score)}`}>
                      {f.score}/25
                    </span>
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full capitalize">{f.category}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{f.mitigation}</p>
                </div>
                <div className="text-right text-[9px] text-muted-foreground space-y-0.5 shrink-0">
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
