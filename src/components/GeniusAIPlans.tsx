import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGeniusPlan } from '@/hooks/useGeniusPlan';
import { GENIUS_PLANS, GENIUS_PLAN_ORDER, PLAN_LABELS, SERVER_PLAN_TO_KEY, CREDIT_PRESETS, creditBonus, creditsForUsd, type GeniusPlanKey } from '@/lib/genius-plans';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Zap, Crown, Building2, Check, Loader2, RefreshCw, ArrowUp, Settings2, Coins } from 'lucide-react';

const ICONS: Record<GeniusPlanKey, typeof Zap> = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
  studio: Building2,
};

const GRADIENTS: Record<GeniusPlanKey, string> = {
  free: 'from-slate-500 to-slate-400',
  starter: 'from-blue-500 to-cyan-500',
  pro: 'from-primary to-teal-400',
  studio: 'from-purple-500 to-pink-500',
};

export default function GeniusAIPlans() {
  const { usage, loading, refetch } = useGeniusPlan();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const currentPlan: GeniusPlanKey = SERVER_PLAN_TO_KEY[usage.plan] ?? 'free';
  const isLegacy = usage.plan !== 'free' && !SERVER_PLAN_TO_KEY[usage.plan];

  const [buyAmount, setBuyAmount] = useState('60');
  const buyUsd = Number(buyAmount) || 0;

  const handleSubscribe = async (priceId: string, amount?: number) => {
    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-genius-checkout', {
        body: { priceId, amount, returnPath: window.location.pathname + window.location.search.replace(/[?&]credits=\w+/, '') },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Checkout unavailable', description: err.message, variant: 'destructive' });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    setCheckoutLoading('portal');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Could not open billing', description: err.message, variant: 'destructive' });
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Balance header */}
      <Card className="tech-card border-0 overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">AI Credits</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-foreground">{usage.balance.toLocaleString(undefined, { maximumFractionDigits: 1 })} credits</h3>
                  <Badge variant={usage.plan === 'free' ? 'secondary' : 'default'} className="text-xs">
                    {PLAN_LABELS[usage.plan] ?? 'Free'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {usage.has_customer && (
                <Button variant="outline" size="sm" onClick={openPortal} disabled={checkoutLoading === 'portal'} className="gap-2">
                  {checkoutLoading === 'portal' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings2 className="h-3.5 w-3.5" />}
                  Manage billing
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {usage.monthly_credits > 0
              ? `${usage.monthly_credits.toLocaleString()} credits are added every month${usage.current_period_end ? `; next billing ${new Date(usage.current_period_end).toLocaleDateString()}` : ''}${usage.cancel_at_period_end ? ' (cancels at period end)' : ''}. Unused credits roll over.`
              : 'You get 5 free credits every day. Upgrade for a monthly credit allowance that rolls over.'}
            {isLegacy ? ' Your existing plan has been converted to monthly credits.' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GENIUS_PLAN_ORDER.map((key) => {
          const plan = GENIUS_PLANS[key];
          const Icon = ICONS[key];
          const isCurrent = currentPlan === key && !isLegacy;
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
                  <span className="text-2xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
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

      {/* One-time credit purchase - no cap */}
      <Card className="tech-card border-0">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <h4 className="text-base font-bold text-foreground">Buy credits</h4>
            <Badge variant="secondary" className="text-[10px]">One-time, no limit</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Choose an amount</p>
              <Select value={CREDIT_PRESETS.includes(buyUsd) ? String(buyUsd) : ''} onValueChange={setBuyAmount}>
                <SelectTrigger><SelectValue placeholder="Custom amount" /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  {CREDIT_PRESETS.map((usd) => (
                    <SelectItem key={usd} value={String(usd)}>
                      ${usd} - {creditsForUsd(usd).toLocaleString()} credits{creditBonus(usd) ? ` (${Math.round(creditBonus(usd) * 100)}% bonus)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Or enter any amount (USD, $15 minimum)</p>
              <Input type="number" min={15} step={1} value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
            </div>
            <Button
              onClick={() => handleSubscribe('credits', buyUsd)}
              disabled={buyUsd < 15 || checkoutLoading === 'credits'}
              className="gap-2"
            >
              {checkoutLoading === 'credits' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-3.5 w-3.5" />}
              Buy {buyUsd >= 15 ? creditsForUsd(buyUsd).toLocaleString() : ''} credits
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            $0.05 per credit. Bonus credits: 5% from $60, 8% from $100, 12% from $250, 15% from $500. No maximum. Credits never expire. All sales are final.
          </p>
        </CardContent>
      </Card>

      {/* Credit / pricing disclosure */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">How credits work</p>
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          <li>• 1 credit = 1 AI build (a new section, database table, automation or page redesign).</li>
          <li>• Quick chat answers and small text or style tweaks cost 0.2 credits (5 per credit).</li>
          <li>• Editing by hand, undo, redo and restoring versions are always free.</li>
          <li>• Everyone gets 100 welcome credits plus 5 free credits every day.</li>
          <li>• Monthly plans add credits each billing month. Unused credits roll over while you stay subscribed.</li>
          <li>• Cancel, upgrade or downgrade anytime from Manage billing.</li>
        </ul>
      </div>
    </div>
  );
}
