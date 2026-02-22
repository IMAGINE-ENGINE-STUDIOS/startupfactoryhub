import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Users, DollarSign, Search, RefreshCw, TrendingUp } from 'lucide-react';
import { MEMBERSHIP_TIERS, getTierLabel } from '@/lib/membership-tiers';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SubscriptionRecord {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  product_id: string;
  price_id: string;
  tier: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
}

const SubscriptionsManagement = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each subscription
      if (data && data.length > 0) {
        const userIds = data.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        const enriched = data.map(sub => ({
          ...sub,
          profile: profiles?.find(p => p.user_id === sub.user_id) || null,
        }));
        setSubscriptions(enriched as SubscriptionRecord[]);
      } else {
        setSubscriptions([]);
      }
    } catch (err: any) {
      toast.error('Failed to load subscriptions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filtered = subscriptions.filter(sub => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.profile?.full_name?.toLowerCase().includes(q) ||
      sub.profile?.email?.toLowerCase().includes(q) ||
      sub.tier?.toLowerCase().includes(q) ||
      sub.status?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    mrr: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        const tier = MEMBERSHIP_TIERS[s.tier as keyof typeof MEMBERSHIP_TIERS];
        return sum + (tier?.price || 0);
      }, 0),
    byTier: Object.entries(MEMBERSHIP_TIERS).reduce((acc, [key, val]) => {
      if (key === 'free') return acc;
      acc[key] = subscriptions.filter(s => s.tier === key && s.status === 'active').length;
      return acc;
    }, {} as Record<string, number>),
  };

  const tierColors: Record<string, string> = {
    community: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    self_paced_office: 'bg-primary/10 text-primary border-primary/20',
    global_access: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    corporate: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <DollarSign className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${stats.mrr.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tier Breakdown</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {Object.entries(stats.byTier).map(([tier, count]) => (
                    <Badge key={tier} variant="outline" className={`text-xs ${tierColors[tier] || ''}`}>
                      {getTierLabel(tier)}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Products Info */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Membership Plans (Stripe)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Object.entries(MEMBERSHIP_TIERS).filter(([k]) => k !== 'free').map(([key, tier]) => (
              <div key={key} className={`p-4 rounded-xl border ${tierColors[key] || 'border-border'}`}>
                <h4 className="font-semibold">{tier.name}</h4>
                <p className="text-2xl font-bold mt-1">${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{tier.price_id}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Subscribers</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchSubscriptions}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subscriptions found</p>
              <p className="text-sm mt-1">Subscribers will appear here once users sign up for a plan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{sub.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tierColors[sub.tier] || ''}>
                        {getTierLabel(sub.tier)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                      {sub.cancel_at_period_end && (
                        <Badge variant="destructive" className="ml-1 text-xs">Canceling</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.current_period_end
                        ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(sub.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionsManagement;
