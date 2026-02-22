import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MEMBERSHIP_TIERS, type MembershipTier } from '@/lib/membership-tiers';
import { CreditCard, RefreshCw, ExternalLink, Check, Crown } from 'lucide-react';

interface MembershipStatus {
  subscribed: boolean;
  tier: string;
  product_id?: string;
  subscription_end?: string;
  cancel_at_period_end?: boolean;
}

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

  useEffect(() => {
    checkMembership();
  }, [user]);

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
      if (data?.url) {
        window.open(data.url, '_blank');
      }
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
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setPortalLoading(false);
    }
  };

  const currentTier = status?.tier || 'free';

  const tierOrder: MembershipTier[] = ['free', 'community', 'self_paced_office', 'global_access', 'corporate'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Summary */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-foreground">
                  {MEMBERSHIP_TIERS[currentTier as MembershipTier]?.name || currentTier}
                </h3>
                <Badge variant={status?.subscribed ? 'default' : 'secondary'}>
                  {status?.subscribed ? 'Active' : 'Free'}
                </Badge>
                {status?.cancel_at_period_end && (
                  <Badge variant="destructive">Cancelling</Badge>
                )}
              </div>
              {status?.subscription_end && (
                <p className="text-sm text-muted-foreground">
                  {status.cancel_at_period_end ? 'Access until' : 'Renews on'}{' '}
                  {new Date(status.subscription_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={checkMembership} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {status?.subscribed && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {portalLoading ? 'Loading...' : 'Manage Billing'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tierOrder.filter(t => t !== 'free').map((tierKey) => {
          const tier = MEMBERSHIP_TIERS[tierKey];
          const isCurrentPlan = currentTier === tierKey;
          const currentIndex = tierOrder.indexOf(currentTier as MembershipTier);
          const tierIndex = tierOrder.indexOf(tierKey);
          const isUpgrade = tierIndex > currentIndex;
          const isDowngrade = tierIndex < currentIndex;

          return (
            <Card
              key={tierKey}
              className={`tech-card border-2 transition-all ${
                isCurrentPlan
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {isCurrentPlan && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      Your Plan
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold text-foreground">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {isCurrentPlan ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isUpgrade ? 'default' : 'outline'}
                    onClick={() => tier.price_id && handleSubscribe(tier.price_id)}
                    disabled={checkoutLoading === tier.price_id || !tier.price_id}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
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
          );
        })}
      </div>
    </div>
  );
}
