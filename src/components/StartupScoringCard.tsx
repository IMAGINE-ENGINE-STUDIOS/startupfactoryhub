import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  TrendingUp, 
  Building2, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { 
  getScoreTier, 
  getTierColorClasses,
  CC_FACTOR_LABELS,
  STAGE_LABELS
} from '@/lib/startupScoring';
import { StartupScore } from '@/hooks/useStartupScoring';
import { cn } from '@/lib/utils';

interface StartupScoringCardProps {
  score: StartupScore | null;
  companyName?: string;
  onEditScore?: () => void;
  compact?: boolean;
}

export function StartupScoringCard({ 
  score, 
  companyName,
  onEditScore,
  compact = false 
}: StartupScoringCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!score) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No score recorded yet</p>
          {onEditScore && (
            <Button onClick={onEditScore} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Calculate Score
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const tier = getScoreTier(score.startup_score || 0);
  const tierColors = getTierColorClasses(tier);

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        tierColors.bg,
        tierColors.border
      )}>
        <div className={cn(
          "text-2xl font-bold",
          tierColors.text
        )}>
          {score.startup_score || 0}
        </div>
        <div className="flex-1">
          <Badge variant="outline" className={cn(tierColors.bg, tierColors.text, tierColors.border)}>
            {tier.emoji} {tier.label}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className="tech-card border-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {companyName ? `${companyName} Score` : 'Startup Score'}
          </CardTitle>
          {onEditScore && (
            <Button onClick={onEditScore} variant="ghost" size="sm">
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className={cn(
          "text-center p-4 rounded-lg border-2",
          tierColors.bg,
          tierColors.border
        )}>
          <div className={cn("text-5xl font-bold mb-1", tierColors.text)}>
            {score.startup_score || 0}
          </div>
          <Badge variant="outline" className={cn(tierColors.bg, tierColors.text, tierColors.border, "text-sm")}>
            {tier.emoji} {tier.label}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>
        </div>

        {/* Score Components */}
        <div className="space-y-3">
          {/* Company Coefficient */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Company Coefficient
              </span>
              <span className="font-medium">{score.company_coefficient?.toFixed(1) || '0'}/10</span>
            </div>
            <Progress 
              value={(score.company_coefficient || 0) * 10} 
              className="h-2"
            />
          </div>

          {/* Traction Score */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Traction Score
              </span>
              <span className="font-medium">{score.traction_score?.toFixed(0) || '0'}/100</span>
            </div>
            <Progress 
              value={score.traction_score || 0} 
              className="h-2"
            />
          </div>

          {/* Market EMS */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                Market Emergence
              </span>
              <span className="font-medium">{score.market_ems_score?.toFixed(0) || '50'}/100</span>
            </div>
            <Progress 
              value={score.market_ems_score || 50} 
              className="h-2"
            />
          </div>
        </div>

        {/* Market & Stage Info */}
        <div className="flex flex-wrap gap-2">
          {score.primary_market && (
            <Badge variant="secondary" className="text-xs">
              {score.primary_market}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {STAGE_LABELS[score.ts_stage] || score.ts_stage}
          </Badge>
        </div>

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Details
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            {/* CC Factor Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Company Coefficient Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(CC_FACTOR_LABELS).map(([key, label]) => {
                  const dbKey = `cc_${key}` as keyof StartupScore;
                  const value = score[dbKey] as number || 5;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-muted-foreground truncate" title={label}>
                        {label.split(' ')[0]}
                      </span>
                      <span className="font-medium">{value}/10</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Traction Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Traction Metrics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue Growth</span>
                  <span className="font-medium">{score.ts_revenue_growth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Users/Pilots</span>
                  <span className="font-medium">{score.ts_user_pilot_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retention</span>
                  <span className="font-medium">{score.ts_retention_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Cycle</span>
                  <span className="font-medium">{score.ts_sales_cycle_days}d</span>
                </div>
              </div>
            </div>

            {/* Weights */}
            <div className="text-xs text-muted-foreground">
              <span>Weights: α={score.weight_alpha}, β={score.weight_beta}, γ={score.weight_gamma}</span>
            </div>

            {/* Notes */}
            {score.notes && (
              <div className="text-xs">
                <span className="text-muted-foreground">Notes: </span>
                <span>{score.notes}</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground">
              Scored: {new Date(score.scored_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
