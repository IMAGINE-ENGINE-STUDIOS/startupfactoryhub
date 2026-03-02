import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MEMBERSHIP_TIERS, type MembershipTier } from '@/lib/membership-tiers';
import { CreditCard, RefreshCw, Crown, Zap, Building, Users, ArrowUp, ArrowDown, Check, Loader2 } from 'lucide-react';

interface MembershipStatus {
  subscribed: boolean;
  tier: string;
  product_id?: string;
  subscription_end?: string;
  cancel_at_period_end?: boolean;
}

const TIER_CONFIG: Record<string, { icon: typeof Zap; gradient: string; glow: string; description: string; bestFor: string; features: string[] }> = {
  community: {
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
    description: 'Full digital access, virtual events, community, and mentor interactions.',
    bestFor: 'Remote-first teams or early MVP-stage founders',
    features: ['Full resource library', 'Mentor sessions (virtual)', 'Startup physical hub community access', 'Local Startup Factory HUB coworking space access all locations (community space access only)'],
  },
  self_paced_office: {
    icon: Building,
    gradient: 'from-primary to-teal-400',
    glow: 'shadow-primary/20',
    description: 'Adds local Startup Factory HUB Desk coworking access all locations to the community plan.',
    bestFor: 'Founders needing flexible workspace + virtual resources',
    features: ['All community features', 'Local Startup Factory HUB Desk coworking access all locations', 'Earth Intelligence satellite data access', 'Eligible for Accelerated Tier'],
  },
  global_access: {
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/20',
    description: 'All platform features + unlimited Global office access across Startup Factory Hub network (130+ countries, 5,600+ sites).',
    bestFor: 'Globally distributed teams, traveling founders',
    features: ['All features + Global office access across Startup Factory Hub network', 'Mentor + event access', 'Earth Intelligence satellite data access', 'Eligible for Accelerated Tier'],
  },
  corporate: {
    icon: Users,
    gradient: 'from-orange-500 to-red-500',
    glow: 'shadow-orange-500/20',
    description: 'Designed for corporate innovation teams and growth-stage startups with teams across regions.',
    bestFor: 'Scale-ups or corporate venture units',
    features: ['All features + team dashboard', 'Unlimited travel to 11 countries (only pay ticket taxes, travel with Frontier)', 'Global coworking access', 'Soft Landing discount ($5,000) — expand to Japan, USA, Europe, Chile or Venezuela', 'Mentor + event access', 'Earth Intelligence satellite data access', 'Accelerated Tier if eligible'],
  },
};

const tierOrder: MembershipTier[] = ['free', 'community', 'self_paced_office', 'global_access', 'corporate'];

export default function ProfileSubscriptionTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

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

  const handleSubscribe = async (priceId: string) => {
    if (!user) return;
    setCheckoutLoading(priceId);
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

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tierOrder.filter(t => t !== 'free').map((tierKey) => {
          const tier = MEMBERSHIP_TIERS[tierKey];
          const config = TIER_CONFIG[tierKey];
          const Icon = config.icon;
          const isCurrentPlan = currentTier === tierKey;
          const currentIndex = tierOrder.indexOf(currentTier as MembershipTier);
          const tierIndex = tierOrder.indexOf(tierKey);
          const isUpgrade = tierIndex > currentIndex;
          const isDowngrade = tierIndex < currentIndex;

          return (
            <div key={tierKey} className="relative group">
              {/* Active glow */}
              {isCurrentPlan && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-teal-400 rounded-2xl opacity-40 blur-sm animate-pulse" />
              )}
              {/* Hover glow */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${config.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-sm transition-all duration-500`} />

              <Card className={`relative tech-card border-0 h-full transition-all duration-300 ${
                isCurrentPlan ? 'ring-2 ring-primary/50' : 'hover:scale-[1.02]'
              }`}>
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Icon & Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.glow}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {isCurrentPlan && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                        <Check className="h-3 w-3 mr-1" /> Current
                      </Badge>
                    )}
                  </div>

                  {/* Name & Price */}
                  <h4 className="text-base font-bold text-foreground mb-1">{tier.name}</h4>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-foreground">${tier.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mb-3">{config.description}</p>

                  {/* Best For */}
                  <p className="text-xs mb-3">
                    <span className="font-semibold text-foreground">Best for: </span>
                    <span className="text-muted-foreground">{config.bestFor}</span>
                  </p>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-4">
                    {config.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Action Button */}
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
                      className={`w-full mt-3 ${isUpgrade ? `bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white border-0` : ''}`}
                      variant={isUpgrade ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => tier.price_id && handleSubscribe(tier.price_id)}
                      disabled={checkoutLoading === tier.price_id || !tier.price_id}
                    >
                      {checkoutLoading === tier.price_id ? (
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      ) : isUpgrade ? (
                        <ArrowUp className="h-3.5 w-3.5 mr-2" />
                      ) : isDowngrade ? (
                        <ArrowDown className="h-3.5 w-3.5 mr-2" />
                      ) : null}
                      {checkoutLoading === tier.price_id
                        ? 'Loading...'
                        : isUpgrade
                          ? 'Upgrade'
                          : isDowngrade
                            ? 'Downgrade'
                            : 'Get Started'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
