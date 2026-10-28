import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store, Compass, MessagesSquare, ShoppingBag, TrendingUp,
  CheckCircle2, Circle, Lock, Rocket, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { useMembershipAccess, useMembershipPrompt } from '@/features/basic-plan';

// Phase 1, Step 3 — "Get Customers" journey card.
//
// One honest status per step, each derived from the signed-in user's own
// rows (no fake completion states):
//   1. Publish your offer  -> profile_listings (active) for this user
//   2. Get discovered      -> profile_views where viewed_profile_id = user
//                             (written by useProfileViews on every non-self
//                             public-page view; same source as analytics)
//   3. Start conversations -> conversations where user is user1 or user2
//   4. Sell                -> profile_sales where seller_id = user and
//                             status = 'paid' (rows are only recorded by the
//                             profile-checkout function after payment)
//   5. Track & grow        -> roadmap_progress via useRoadmapProgress
// Membership posture follows src/features/basic-plan: members get working
// actions; free accounts see the same card as a preview and every action
// opens the standard membership upgrade prompt instead of navigating.

interface JourneyStats {
  hasStartup: boolean;
  liveListings: number;
  profileViews: number;
  conversations: number;
  sales: number;
  salesCents: number;
}

interface StepDef {
  icon: typeof Store;
  title: string;
  detail: string;
  done: boolean;
  actionLabel: string;
  href: string;
}

export default function GetCustomersCard() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const { isMember, loading: accessLoading } = useMembershipAccess();
  const { requireMembership, dialog } = useMembershipPrompt('Get Customers journey');
  const roadmap = useRoadmapProgress();

  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const uid = user.id;
        const [companiesRes, membersRes, listingsRes, viewsRes, convosRes, salesRes] =
          await Promise.all([
            supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', uid),
            supabase.from('company_members').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'approved'),
            supabase.from('profile_listings').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('active', true),
            supabase.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_profile_id', uid),
            supabase.from('conversations').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${uid},user2_id.eq.${uid}`),
            supabase.from('profile_sales').select('amount_cents').eq('seller_id', uid).eq('status', 'paid'),
          ]);

        if (cancelled) return;
        setStats({
          hasStartup: (companiesRes.count ?? 0) > 0 || (membersRes.count ?? 0) > 0,
          liveListings: listingsRes.count ?? 0,
          profileViews: viewsRes.count ?? 0,
          conversations: convosRes.count ?? 0,
          sales: (salesRes.data || []).length,
          salesCents: (salesRes.data || []).reduce((sum, r) => sum + (r.amount_cents || 0), 0),
        });
      } catch {
        if (!cancelled) setStatsFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const shopUrl = `/u/${user.id}?tab=shop`;
  const loadingStats = stats === null && !statsFailed;
  // When the progress queries fail we cannot truthfully claim "Not yet" —
  // steps stay visible and link-only, with no status badge.
  const statusKnown = !loadingStats && !statsFailed;

  const steps: StepDef[] = [
        {
          icon: Store,
          title: 'Publish your offer',
          done: (stats?.liveListings ?? 0) > 0,
          detail: statsFailed
            ? 'Progress could not be loaded — open your shop to check'
            : loadingStats
            ? 'Checking your public page…'
            : (stats?.liveListings ?? 0) > 0
              ? `${stats!.liveListings} live listing${stats!.liveListings === 1 ? '' : 's'} on your public page`
              : stats?.hasStartup
                ? 'Your startup profile is live — now list what you sell'
                : 'List your first product or service on your public page',
          actionLabel: (stats?.liveListings ?? 0) > 0 ? 'Open my shop' : 'List what you sell',
          href: shopUrl,
        },
        {
          icon: Compass,
          title: 'Get discovered',
          done: (stats?.profileViews ?? 0) > 0,
          detail: statsFailed
            ? 'Progress could not be loaded — open the network to check'
            : loadingStats
            ? 'Checking your reach…'
            : (stats?.profileViews ?? 0) > 0
              ? `Your public page has been viewed ${stats!.profileViews} time${stats!.profileViews === 1 ? '' : 's'}`
              : 'Get found through network search and matching',
          actionLabel: 'Open the network',
          href: '/dashboard?tab=network',
        },
        {
          icon: MessagesSquare,
          title: 'Start conversations',
          done: (stats?.conversations ?? 0) > 0,
          detail: statsFailed
            ? 'Progress could not be loaded — open messages to check'
            : loadingStats
            ? 'Checking your inbox…'
            : (stats?.conversations ?? 0) > 0
              ? `${stats!.conversations} conversation${stats!.conversations === 1 ? '' : 's'} started`
              : 'Message members directly — no cold outreach needed',
          actionLabel: 'Open messages',
          href: '/messages',
        },
        {
          icon: ShoppingBag,
          title: 'Sell',
          done: (stats?.sales ?? 0) > 0,
          detail: statsFailed
            ? 'Progress could not be loaded — open your listings to check'
            : loadingStats
            ? 'Checking your sales…'
            : (stats?.sales ?? 0) > 0
              ? `${stats!.sales} sale${stats!.sales === 1 ? '' : 's'} · $${(stats!.salesCents / 100).toFixed(0)} through your public page`
              : 'Buyers check out on your listings — payment is handled for you',
          actionLabel: 'Manage my listings',
          href: shopUrl,
        },
        {
          icon: TrendingUp,
          title: 'Track & grow',
          done: roadmap.completedSteps > 0,
          detail: roadmap.loading
            ? 'Checking your roadmap…'
            : roadmap.completedSteps > 0
              ? `${roadmap.completedSteps} of ${roadmap.totalSteps} roadmap steps completed`
              : 'Follow your founder roadmap, step by step',
          actionLabel: role === 'member' ? 'Go to My Startups' : 'Open my roadmap',
          // The full roadmap (StartupRoadmap) lives on the founder
          // dashboard's Journey tab; the member dashboard has no Journey
          // tab, so members land on My Startups instead.
          href: role === 'member' ? '/dashboard?tab=startups' : '/dashboard?tab=journey',
        },
      ];

  const doneCount = steps.filter((s) => s.done).length;

  const handleAction = (href: string) => {
    // Free/limited accounts preview the journey; actions are gated through
    // the standard basic-plan upgrade prompt.
    if (!accessLoading && !isMember) {
      requireMembership();
      return;
    }
    navigate(href);
  };

  return (
    <Card className="tech-card border-0 mb-4 sm:mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-primary" />
              Get Customers
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your journey from offer to revenue — publish, get discovered, talk, sell, and track it all in one place.
            </p>
          </div>
          {!accessLoading && (
            isMember ? (
              <Badge variant="secondary" className="shrink-0">
                {loadingStats || statsFailed ? 'Your journey' : `${doneCount} of ${steps.length} steps done`}
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 gap-1">
                <Lock className="h-3 w-3" /> Free preview
              </Badge>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => {
          // Steps 1–4 share the stats queries; step 5 follows the roadmap hook.
          const showStatus = i === 4 ? !roadmap.loading : statusKnown;
          return (
            <div
              key={step.title}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span> {step.title}
                  {showStatus && (
                    step.done ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Circle className="h-3.5 w-3.5" /> Not yet
                      </span>
                    )
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.detail}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleAction(step.href)}>
                {step.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
        {!accessLoading && !isMember && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <Lock className="h-3 w-3" />
            You're previewing the journey on a free account — membership unlocks every step.
          </p>
        )}
      </CardContent>
      {dialog}
    </Card>
  );
}
