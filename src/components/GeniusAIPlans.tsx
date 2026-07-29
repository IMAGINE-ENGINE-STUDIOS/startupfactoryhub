import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGeniusPlan } from '@/hooks/useGeniusPlan';
import { GENIUS_PLANS, GENIUS_PLAN_ORDER, type GeniusPlanKey } from '@/lib/genius-plans';
import { Sparkles, Zap, Crown, Building2, Check, Loader2, RefreshCw, ArrowUp } from 'lucide-react';

const ICONS: Record<GeniusPlanKey, typeof Zap> = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
  enterprise: Building2,
};

const GRADIENTS: Record<GeniusPlanKey, string> = {
  free: 'from-slate-500 to-slate-400',
  starter: 'from-blue-500 to-cyan-500',
  pro: 'from-primary to-teal-400',
  enterprise: 'from-purple-500 to-pink-500',
};

export default function GeniusAIPlans() {
  const { usage, loading, refetch } = useGeniusPlan();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const currentPlan = (usage.plan as GeniusPlanKey) || 'free';
  const pct = usage.limit > 0 ? Math.min(100, Math.round((usage.turns_used / usage.limit) * 100)) : 0;

  const handleSubscribe = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-genius-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Usage header */}
      <Card className="tech-card border-0 overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Genius AI Plan</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{GENIUS_PLANS[currentPlan]?.name}</h3>
                  <Badge variant={currentPlan === 'free' ? 'secondary' : 'default'} className="text-xs">
                    {GENIUS_PLANS[currentPlan]?.allowance}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Turns used this month</span>
              <span className="font-semibold text-foreground">
                {usage.turns_used.toLocaleString()} / {usage.limit.toLocaleString()}
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-[11px] text-muted-foreground">
              {(usage.input_tokens + usage.output_tokens).toLocaleString()} tokens consumed
              {usage.turns_used >= usage.limit ? ' — limit reached, upgrade to continue.' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GENIUS_PLAN_ORDER.map((key) => {
          const plan = GENIUS_PLANS[key];
          const Icon = ICONS[key];
          const isCurrent = currentPlan === key;
          const isUpgrade = GENIUS_PLAN_ORDER.indexOf(key) > GENIUS_PLAN_ORDER.indexOf(currentPlan);

          return (
            <Card
              key={key}
              className={`tech-card border-0 h-full transition-all duration-300 ${
                isCurrent ? 'ring-2 ring-primary/50' : 'hover:scale-[1.02]'
              }`}
            >
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[key]} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  {isCurrent && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                      <Check className="h-3 w-3 mr-1" /> Current
                    </Badge>
                  )}
                </div>

                <h4 className="text-base font-bold text-foreground mb-1">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-3">
                  {plan.price === null ? (
                    <span className="text-2xl font-bold text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-3">{plan.allowance}</p>

                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex-1" />

                {isCurrent ? (
                  <Button className="w-full mt-3" variant="outline" size="sm" disabled>
                    Current plan
                  </Button>
                ) : plan.price_id ? (
                  <Button
                    className={`w-full mt-3 ${isUpgrade ? `bg-gradient-to-r ${GRADIENTS[key]} hover:opacity-90 text-white border-0` : ''}`}
                    variant={isUpgrade ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSubscribe(plan.price_id!)}
                    disabled={checkoutLoading === plan.price_id}
                  >
                    {checkoutLoading === plan.price_id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 mr-2" />
                    )}
                    {isUpgrade ? 'Upgrade' : 'Switch'}
                  </Button>
                ) : key === 'enterprise' ? (
                  <Button
                    className="w-full mt-3"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('mailto:ceo@imagineengine.space?subject=Genius%20AI%20Enterprise', '_blank')}
                  >
                    Contact sales
                  </Button>
                ) : (
                  <Button className="w-full mt-3" variant="outline" size="sm" disabled>
                    Included
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
