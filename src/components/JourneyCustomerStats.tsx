import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Store, Users, MessagesSquare, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Live proof block for Journey step 7 ("Get Customers, Sell & Grow")
// in StartupRoadmap — the single customers / sales / growth step.
//
// Every number comes from the signed-in user's OWN rows — the same
// queries the retired dashboard card used:
//   - profile_listings: active listings on the user's public page
//   - profile_views:    rows where viewed_profile_id = user (written by
//                       useProfileViews on every non-self public-page view)
//   - conversations:    rows where the user is user1_id or user2_id
//   - profile_sales:    rows where seller_id = user AND status = 'paid'
//                       (recorded only by the profile-checkout function
//                       after a real payment)
//
// Honesty rules: while the queries are in flight, and if any of them
// fail, this renders NOTHING — no placeholder zeros, no guessed state.
// Checklist tasks in the step stay manual, exactly like steps 1-6;
// this block carries the proof, it never writes checklist state.

interface CustomerStats {
  liveListings: number;
  profileViews: number;
  conversations: number;
  sales: number;
  salesCents: number;
}

interface JourneyCustomerStatsProps {
  disabled?: boolean;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export default function JourneyCustomerStats({ disabled = false }: JourneyCustomerStatsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const uid = user.id;
      const [listingsRes, viewsRes, convosRes, salesRes] = await Promise.all([
        supabase.from('profile_listings').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('active', true),
        supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_profile_id', uid),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${uid},user2_id.eq.${uid}`),
        supabase.from('profile_sales').select('amount_cents').eq('seller_id', uid).eq('status', 'paid'),
      ]);

      if (cancelled) return;
      if (listingsRes.error || viewsRes.error || convosRes.error || salesRes.error) {
        setFailed(true);
        return;
      }
      setStats({
        liveListings: listingsRes.count ?? 0,
        profileViews: viewsRes.count ?? 0,
        conversations: convosRes.count ?? 0,
        sales: (salesRes.data || []).length,
        salesCents: (salesRes.data || []).reduce((sum, r) => sum + (r.amount_cents || 0), 0),
      });
    })();

    return () => { cancelled = true; };
  }, [user]);

  // No block at all until real numbers are known — never render guesses.
  if (!user || disabled || failed || stats === null) return null;

  const shopUrl = `/u/${user.id}?tab=shop`;
  const earned = stats.salesCents % 100 === 0
    ? `$${stats.salesCents / 100}`
    : `$${(stats.salesCents / 100).toFixed(2)}`;
  const nothingYet = stats.liveListings === 0 && stats.conversations === 0 && stats.sales === 0;

  return (
    <div className="space-y-3 rounded-md border border-border/50 bg-primary/5 p-3.5">
      <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Live proof from your account
      </h4>

      <p className="text-sm font-medium tabular-nums">
        {stats.liveListings} active {plural(stats.liveListings, 'listing', 'listings')}
        {' · '}
        {stats.profileViews} profile {plural(stats.profileViews, 'view', 'views')}
        {' · '}
        {stats.conversations} {plural(stats.conversations, 'conversation', 'conversations')}
      </p>
      <p className="text-sm font-medium tabular-nums">
        {stats.sales > 0
          ? `${stats.sales} ${plural(stats.sales, 'sale', 'sales')} · ${earned} earned through your public page`
          : 'No sales yet — buyers check out on your public page listings'}
      </p>

      <div className="space-y-1">
        {stats.liveListings > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Proven: you have {stats.liveListings} active {plural(stats.liveListings, 'listing', 'listings')} on your public page
          </p>
        )}
        {stats.conversations > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Proven: you have started {stats.conversations} {plural(stats.conversations, 'conversation', 'conversations')}
          </p>
        )}
        {stats.sales > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Proven: {stats.sales} paid {plural(stats.sales, 'sale', 'sales')} recorded through your public page checkout
          </p>
        )}
        {nothingYet && (
          <p className="text-xs text-muted-foreground">
            Nothing here yet — list what you sell, then start a conversation and this block shows your real numbers.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(shopUrl)}>
          <Store className="w-3.5 h-3.5" />
          List what you sell
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/dashboard?tab=network')}>
          <Users className="w-3.5 h-3.5" />
          Open the network
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/messages')}>
          <MessagesSquare className="w-3.5 h-3.5" />
          Open messages
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/dashboard?tab=analytics')}>
          <BarChart3 className="w-3.5 h-3.5" />
          Open analytics
        </Button>
      </div>
    </div>
  );
}
