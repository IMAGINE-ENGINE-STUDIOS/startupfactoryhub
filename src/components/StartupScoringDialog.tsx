import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  TrendingUp,
  Globe,
  Save,
  Calculator,
  Sparkles,
  Info
} from 'lucide-react';
import {
  CC_FACTOR_LABELS,
  CC_FACTOR_DESCRIPTIONS,
  CC_FACTOR_WEIGHTS,
  STAGE_LABELS,
  CCFactorScores,
  TractionMetrics,
  ScoreWeights,
  getScoreTier,
  getTierColorClasses
} from '@/lib/startupScoring';
import { useStartupScoring, MarketTheme } from '@/hooks/useStartupScoring';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StartupScoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName?: string;
  cohortStartupId?: string;
  onScoreSaved?: () => void;
}

export function StartupScoringDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  cohortStartupId,
  onScoreSaved
}: StartupScoringDialogProps) {
  const { score, marketThemes, saving, saveScore, getCalculatedScore } = useStartupScoring(companyId);

  // CC Factors state
  const [ccFactors, setCCFactors] = useState<CCFactorScores>({
    founder_team_quality: 5,
    intellectual_property: 5,
    product_market_fit: 5,
    strategic_partnerships: 5,
    exit_environment: 5,
    supply_chain_stability: 5,
    regulatory_momentum: 5,
    capital_efficiency: 5,
    recurring_revenue_ratio: 5,
    tech_replacement_risk: 5
  });

  // Traction metrics state
  const [tractionMetrics, setTractionMetrics] = useState<TractionMetrics>({
    revenue_growth: 0,
    user_pilot_count: 0,
    retention_rate: 0,
    sales_cycle_days: 90,
    stage: 'pre_seed'
  });

  // Market state
  const [primaryMarket, setPrimaryMarket] = useState<string>('');
  const [emsScore, setEmsScore] = useState(50);

  // Weights state
  const [weights, setWeights] = useState<ScoreWeights>({
    alpha: 0.5,
    beta: 0.5,
    gamma: 1.0
  });

  // Notes
  const [notes, setNotes] = useState('');

  // Load existing score data
  useEffect(() => {
    if (score) {
      setCCFactors({
        founder_team_quality: score.cc_founder_team_quality,
        intellectual_property: score.cc_intellectual_property,
        product_market_fit: score.cc_product_market_fit,
        strategic_partnerships: score.cc_strategic_partnerships,
        exit_environment: score.cc_exit_environment,
        supply_chain_stability: score.cc_supply_chain_stability,
        regulatory_momentum: score.cc_regulatory_momentum,
        capital_efficiency: score.cc_capital_efficiency,
        recurring_revenue_ratio: score.cc_recurring_revenue_ratio,
        tech_replacement_risk: score.cc_tech_replacement_risk
      });
      setTractionMetrics({
        revenue_growth: Number(score.ts_revenue_growth) || 0,
        user_pilot_count: score.ts_user_pilot_count,
        retention_rate: Number(score.ts_retention_rate) || 0,
        sales_cycle_days: score.ts_sales_cycle_days,
        stage: score.ts_stage
      });
      setPrimaryMarket(score.primary_market || '');
      setEmsScore(Number(score.market_ems_score) || 50);
      setWeights({
        alpha: Number(score.weight_alpha) || 0.5,
        beta: Number(score.weight_beta) || 0.5,
        gamma: Number(score.weight_gamma) || 1.0
      });
      setNotes(score.notes || '');
    }
  }, [score]);

  // Update EMS when market changes
  useEffect(() => {
    const theme = marketThemes.find(t => t.name === primaryMarket);
    if (theme) {
      setEmsScore(Number(theme.ems_score));
    }
  }, [primaryMarket, marketThemes]);

  // Calculate preview score
  const previewScore = getCalculatedScore(ccFactors, tractionMetrics, emsScore, weights);
  const tier = getScoreTier(previewScore.startupScore);
  const tierColors = getTierColorClasses(tier);

  const handleSave = async () => {
    const result = await saveScore(
      ccFactors,
      tractionMetrics,
      primaryMarket || null,
      emsScore,
      weights,
      notes,
      cohortStartupId
    );
    if (result) {
      onScoreSaved?.();
      onOpenChange(false);
    }
  };

  const updateCCFactor = (key: keyof CCFactorScores, value: number) => {
    setCCFactors(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Score {companyName || 'Startup'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: Score Preview */}
          <div className="space-y-4">
            <div className={cn(
              "text-center p-4 rounded-lg border-2",
              tierColors.bg,
              tierColors.border
            )}>
              <div className="text-xs text-muted-foreground mb-1">Startup Score</div>
              <div className={cn("text-5xl font-bold", tierColors.text)}>
                {previewScore.startupScore}
              </div>
              <Badge variant="outline" className={cn(tierColors.bg, tierColors.text, tierColors.border, "mt-2")}>
                {tier.emoji} {tier.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Company Coefficient</span>
                <span className="font-medium">{previewScore.companyCoefficient.toFixed(1)}/10</span>
              </div>
              <Progress value={previewScore.companyCoefficient * 10} className="h-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Traction Score</span>
                <span className="font-medium">{previewScore.tractionScore.toFixed(0)}/100</span>
              </div>
              <Progress value={previewScore.tractionScore} className="h-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Market EMS</span>
                <span className="font-medium">{emsScore}/100</span>
              </div>
              <Progress value={emsScore} className="h-2" />
            </div>
          </div>

          {/* Right: Input Tabs */}
          <div className="md:col-span-2">
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="company" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="traction" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Traction
                </TabsTrigger>
                <TabsTrigger value="market" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Market
                </TabsTrigger>
                <TabsTrigger value="weights" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Weights
                </TabsTrigger>
              </TabsList>

              {/* Company Coefficient Tab */}
              <TabsContent value="company" className="space-y-3 mt-4">
                <TooltipProvider>
                  {Object.entries(CC_FACTOR_LABELS).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">{label}</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{CC_FACTOR_DESCRIPTIONS[key]}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Weight: {CC_FACTOR_WEIGHTS[key as keyof typeof CC_FACTOR_WEIGHTS]}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-xs font-medium">
                          {ccFactors[key as keyof CCFactorScores]}/10
                        </span>
                      </div>
                      <Slider
                        value={[ccFactors[key as keyof CCFactorScores]]}
                        onValueChange={([v]) => updateCCFactor(key as keyof CCFactorScores, v)}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </TooltipProvider>
              </TabsContent>

              {/* Traction Tab */}
              <TabsContent value="traction" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Revenue Growth (% MoM)</Label>
                    <Input
                      type="number"
                      value={tractionMetrics.revenue_growth}
                      onChange={(e) => setTractionMetrics(prev => ({
                        ...prev,
                        revenue_growth: Number(e.target.value)
                      }))}
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Users / Pilots</Label>
                    <Input
                      type="number"
                      value={tractionMetrics.user_pilot_count}
                      onChange={(e) => setTractionMetrics(prev => ({
                        ...prev,
                        user_pilot_count: Number(e.target.value)
                      }))}
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Retention Rate (%)</Label>
                    <Input
                      type="number"
                      value={tractionMetrics.retention_rate}
                      onChange={(e) => setTractionMetrics(prev => ({
                        ...prev,
                        retention_rate: Math.min(100, Number(e.target.value))
                      }))}
                      placeholder="e.g., 85"
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Sales Cycle (days)</Label>
                    <Input
                      type="number"
                      value={tractionMetrics.sales_cycle_days}
                      onChange={(e) => setTractionMetrics(prev => ({
                        ...prev,
                        sales_cycle_days: Number(e.target.value)
                      }))}
                      placeholder="e.g., 60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stage</Label>
                  <Select
                    value={tractionMetrics.stage}
                    onValueChange={(v) => setTractionMetrics(prev => ({ ...prev, stage: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Market Tab */}
              <TabsContent value="market" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Primary Market / Theme</Label>
                  <Select value={primaryMarket} onValueChange={setPrimaryMarket}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketThemes.map((theme) => (
                        <SelectItem key={theme.id} value={theme.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{theme.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              EMS: {theme.ems_score}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Emerging Market Score (EMS)</Label>
                    <span className="text-xs font-medium">{emsScore}/100</span>
                  </div>
                  <Slider
                    value={[emsScore]}
                    onValueChange={([v]) => setEmsScore(v)}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = more emerging/trending market opportunity
                  </p>
                </div>

                {primaryMarket && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    {(() => {
                      const theme = marketThemes.find(t => t.name === primaryMarket);
                      return theme ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{theme.name}</p>
                          <p className="text-xs text-muted-foreground">{theme.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              Trend: {theme.trend_direction}
                            </Badge>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* Weights Tab */}
              <TabsContent value="weights" className="space-y-4 mt-4">
                <p className="text-xs text-muted-foreground mb-4">
                  Adjust scoring weights to customize how factors contribute to the final score.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">α (Company Coefficient Weight)</Label>
                      <span className="text-xs font-medium">{weights.alpha.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[weights.alpha]}
                      onValueChange={([v]) => setWeights(prev => ({ ...prev, alpha: v }))}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">β (Traction Score Weight)</Label>
                      <span className="text-xs font-medium">{weights.beta.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[weights.beta]}
                      onValueChange={([v]) => setWeights(prev => ({ ...prev, beta: v }))}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">γ (Market EMS Multiplier)</Label>
                      <span className="text-xs font-medium">{weights.gamma.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[weights.gamma]}
                      onValueChange={([v]) => setWeights(prev => ({ ...prev, gamma: v }))}
                      min={0.5}
                      max={1.5}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 text-xs">
                  <p className="font-medium mb-1">Formula:</p>
                  <p className="text-muted-foreground">
                    CoreScore = α × CC + β × TS<br />
                    StartupScore = CoreScore × (0.5 + γ × EMS × 0.5)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Notes */}
            <div className="mt-4 space-y-2">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this score..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Score'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
