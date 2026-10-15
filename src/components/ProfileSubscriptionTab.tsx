import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MEMBERSHIP_TIERS, type MembershipTier } from '@/lib/membership-tiers';
import { CreditCard, RefreshCw, Crown, Zap, Building, Users, TrendingUp, ArrowUp, Check, Loader2 } from 'lucide-react';
import { createBasicPlanCheckout } from '@/features/basic-plan/api/basicPlanApi';
import { createInvestorPlanCheckout } from '@/features/investor-plan/api/investorPlanApi';
import GeniusAIPlans from '@/components/GeniusAIPlans';


interface MembershipStatus {
  subscribed: boolean;
  tier: string;
  product_id?: string;
  subscription_end?: string;
  cancel_at_period_end?: boolean;
}

/**
 * Current subscription line-up (matches the public pricing section):
 *  • Basic Plan — $50/mo · $480/yr (startups & students; advisors $250/mo)
 *  • Self-Paced + Desk, Global Access + Office — legacy Stripe tiers
 *  • Corporate — contact sales
 *  • Investor Priority — $500/mo · $5,000/yr
 * The retired $350 Community tier is no longer offered.
 */
type PlanCard = {
  key: string;
  name: string;
  icon: typeof Zap;
  gradient: string;
  glow: string;
  description: string;
  bestFor: string;
  features: string[];
  monthly: number | null;
  yearly: number | null;
  priceLabel?: string;
  /** How the CTA behaves. */
  action: 'legacy' | 'basic' | 'investor' | 'sales';
  tier?: Exclude<MembershipTier, 'free' | 'community'>;
};

const PLANS: PlanCard[] = [
  {
    key: 'basic',
    name: 'Venture Network',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
    description: 'Direct digital access into our global venture builder community, co-founder network, and startup ecosystem.',
    bestFor: 'Early-stage founders, operators and advisors (advisors $250/mo)',
    features: [
      'Venture builder community feed, investor access & resource map',
      'IP & technology access, tools and certified masterclasses',
      'Investor network introductions & mentor interaction',
      'Talent, internships, volunteering & partner perks',
    ],
    monthly: 50,
    yearly: 480,
    action: 'basic',
  },
  {
    key: 'self_paced_office',
    name: MEMBERSHIP_TIERS.self_paced_office.name,
    icon: Building,
    gradient: 'from-primary to-teal-400',
    glow: 'shadow-primary/20',
    description: 'Hands-on venture building with dedicated workspace across Startup Factory Hub locations.',
    bestFor: 'Active founders and core teams building on-site with studio support',
    features: ['All Venture Network benefits included', 'In-residence workspace & dedicated hub desks at all SFH locations', 'Venture studio acceleration: sprints, pitch advisory & roadmap reviews', 'Strategic Business Intelligence suite', 'Priority eligibility for the Accelerated Tier and cohort funding'],
    monthly: MEMBERSHIP_TIERS.self_paced_office.price,
    yearly: MEMBERSHIP_TIERS.self_paced_office.yearly_price,
    action: 'legacy',
    tier: 'self_paced_office',
  },
  {
    key: 'global_access',
    name: MEMBERSHIP_TIERS.global_access.name,
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/20',
    description: 'Global venture builder tier with worldwide private office presence and international investor access.',
    bestFor: 'Scaling startups, cross-border founders and venture partners',
    features: ['All Venture Resident features included', 'Private office & global hub access in 130+ countries (5,800+ locations)', 'Executive mentorship & priority investor access', 'International soft landing & cross-border expansion support', 'Priority demo day pitching & co-investment opportunities'],
    monthly: MEMBERSHIP_TIERS.global_access.price,
    yearly: MEMBERSHIP_TIERS.global_access.yearly_price,
    action: 'legacy',
    tier: 'global_access',
  },
  {
    key: 'investor',
    name: 'Investor Priority',
    icon: TrendingUp,
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
    description: 'Priority deal flow and investor-only tooling across the ecosystem.',
    bestFor: 'Angels, funds and family offices',
    features: ['Priority access to new startup deal flow', 'Investor-only filters & matching', 'Direct intros to founders', 'Data room & pitch access'],
    monthly: 500,
    yearly: 5000,
    action: 'investor',
  },
  {
    key: 'corporate',
    name: MEMBERSHIP_TIERS.corporate.name,
    icon: Users,
    gradient: 'from-orange-500 to-red-500',
    glow: 'shadow-orange-500/20',
    description: 'For corporate innovation teams and growth-stage startups with teams across regions.',
    bestFor: 'Scale-ups or corporate venture units',
    features: ['All features + team dashboard', 'Security — live CCTV surveillance feeds on the global map', 'Global coworking access', 'Soft Landing discount ($5,000) for global expansion'],
    monthly: null,
    yearly: null,
    priceLabel: 'Contact Sales',
    action: 'sales',
  },
];


export default function ProfileSubscriptionTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const checkMembership = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.functions.invoke('check-membership', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setStatus(data);
    } catch (err: any) {
      console.error('Error checking membership:', err);
      setStatus({ subscribed: false, tier: 'free' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkMembership(); }, [user]);

  const handleSubscribe = async (planKey: string, priceId: string) => {
    if (!user) return;
    setCheckoutLoading(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('create-membership-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
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

  /** Routes each card's CTA to the right checkout flow. */
  const handlePlanCta = async (plan: PlanCard, legacyPriceId: string | null) => {
    if (plan.action === 'sales') {
      window.location.href = 'mailto:info@startupfactoryhub.com?subject=Corporate%20membership';
      return;
    }
    if (plan.action === 'legacy') {
      if (legacyPriceId) handleSubscribe(plan.key, legacyPriceId);
      return;
    }
    setCheckoutLoading(plan.key);
    try {
      const url = plan.action === 'basic'
        ? await createBasicPlanCheckout(billing)
        : await createInvestorPlanCheckout(billing);
      window.open(url, '_blank');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCheckoutLoading(null);
    }
  };


  const handleManageSubscription = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPortalLoading(false);
    }
  };

  const currentTier = status?.tier || 'free';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Header */}
      <Card className="tech-card border-0 overflow-hidden">
        <div className="relative p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-teal-400/10" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Current Plan</p>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-foreground">
                    {MEMBERSHIP_TIERS[currentTier as MembershipTier]?.name || 'Free'}
                  </h3>
                  <Badge variant={status?.subscribed ? 'default' : 'secondary'} className="text-xs">
                    {status?.subscribed ? 'Active' : 'Free Tier'}
                  </Badge>
                  {status?.cancel_at_period_end && (
                    <Badge variant="destructive" className="text-xs">Cancelling</Badge>
                  )}
                </div>
                {status?.subscription_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {status.cancel_at_period_end ? 'Access until' : 'Renews'}{' '}
                    {new Date(status.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={checkMembership} disabled={loading} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
              {status?.subscribed && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading} className="gap-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  {portalLoading ? 'Loading...' : 'Manage Billing'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/40 p-1">
          {(['monthly', 'yearly'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setBilling(mode)}
              className={`rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
                billing === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {mode === 'monthly' ? 'Monthly' : 'Yearly · save 10%'}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentTier === plan.key || (plan.tier && currentTier === plan.tier);
          const amount = billing === 'monthly' ? plan.monthly : plan.yearly;
          const legacyPriceId = plan.tier
            ? (billing === 'monthly'
                ? MEMBERSHIP_TIERS[plan.tier].price_id
                : MEMBERSHIP_TIERS[plan.tier].yearly_price_id)
            : null;
          const busy = checkoutLoading === plan.key;

          return (
            <div key={plan.key} className="relative group">
              {isCurrentPlan && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-teal-400 rounded-2xl opacity-40 blur-sm animate-pulse" />
              )}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-sm transition-all duration-500`} />

              <Card className={`relative tech-card border-0 h-full transition-all duration-300 ${
                isCurrentPlan ? 'ring-2 ring-primary/50' : 'hover:scale-[1.02]'
              }`}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg ${plan.glow}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {isCurrentPlan && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                        <Check className="h-3 w-3 mr-1" /> Current
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-foreground mb-1">{plan.name}</h4>
                  <div className="flex items-baseline gap-1 mb-4">
                    {amount === null ? (
                      <span className="text-2xl font-bold text-foreground">{plan.priceLabel || 'Custom'}</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-foreground">${amount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{billing === 'monthly' ? '/mo' : '/yr'}</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>

                  <p className="text-xs mb-3">
                    <span className="font-semibold text-foreground">Best for: </span>
                    <span className="text-muted-foreground">{plan.bestFor}</span>
                  </p>

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex-1" />

                  {isCurrentPlan ? (
                    <Button
                      className="w-full mt-3"
                      variant="outline"
                      size="sm"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-2" />
                      Manage
                    </Button>
                  ) : (
                    <Button
                      className={`w-full mt-3 bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white border-0`}
                      size="sm"
                      onClick={() => handlePlanCta(plan, legacyPriceId)}
                      disabled={busy || (plan.action === 'legacy' && !legacyPriceId)}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      ) : plan.action === 'sales' ? null : (
                        <ArrowUp className="h-3.5 w-3.5 mr-2" />
                      )}
                      {busy ? 'Loading...' : plan.action === 'sales' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>


      {/* Genius AI plans */}
      <div className="pt-2">
        <h3 className="text-lg font-bold text-foreground mb-1">Genius AI</h3>
        <p className="text-xs text-muted-foreground mb-4">
          AI turn allowance for the Genius assistant, billed separately from your membership.
        </p>
        <GeniusAIPlans />
      </div>
    </div>
  );
}

