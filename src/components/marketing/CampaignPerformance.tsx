import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BarChart3, Copy, Link2, Loader2, MousePointerClick, Users } from 'lucide-react';

interface TrackedPost {
  id: string;
  campaign: 'mvp' | 'partners';
  label: string;
  post_text: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  posted_at: string | null;
  status: string;
}

interface ClickRow {
  tracking_code: string;
  visitor_key: string | null;
  created_at: string;
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      }) + ' ET'
    : 'Not posted yet';

export default function CampaignPerformance() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<TrackedPost[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: mvp }, { data: partners }, { data: clickRows }] = await Promise.all([
      supabase
        .from('mvp_campaign_posts')
        .select('id, post_text, tracking_code, tracking_url, posted_at, status')
        .not('tracking_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('partners_campaign_posts')
        .select('id, post_text, tracking_code, tracking_url, posted_at, status')
        .not('tracking_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('campaign_link_clicks')
        .select('tracking_code, visitor_key, created_at')
        .order('created_at', { ascending: false })
        .limit(2000),
    ]);

    const merged: TrackedPost[] = [
      ...((mvp as TrackedPost[]) || []).map((p) => ({
        ...p,
        campaign: 'mvp' as const,
        label: 'MVP Program',
      })),
      ...((partners as TrackedPost[]) || []).map((p) => ({
        ...p,
        campaign: 'partners' as const,
        label: 'Accelerator as a Service',
      })),
    ].sort((a, b) => (b.posted_at ?? '').localeCompare(a.posted_at ?? ''));

    setPosts(merged);
    setClicks((clickRows as ClickRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statsFor = (code: string | null) => {
    if (!code) return { total: 0, unique: 0, last: null as string | null };
    const rows = clicks.filter((c) => c.tracking_code === code);
    return {
      total: rows.length,
      unique: new Set(rows.map((r) => r.visitor_key || r.created_at)).size,
      last: rows[0]?.created_at ?? null,
    };
  };

  const totalClicks = clicks.length;
  const uniqueVisitors = new Set(clicks.map((c) => c.visitor_key || c.created_at)).size;
  const last7 = clicks.filter(
    (c) => Date.now() - new Date(c.created_at).getTime() < 7 * 86400000,
  ).length;

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Tracking link copied');
  };

  if (loading) {
    return (
      <div className="tech-card border-0 rounded-xl p-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="tech-card border-0 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
          <BarChart3 className="h-4 w-4" /> Link Performance
        </div>
        <h3 className="text-xl font-semibold mt-2">UTM Tracking</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Every auto-posted item ships with its own UTM-tagged link. Clicks are recorded when a
          visitor lands on the site through that link.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 mt-6">
          {[
            { label: 'Total clicks', value: totalClicks, icon: MousePointerClick },
            { label: 'Unique visitors', value: uniqueVisitors, icon: Users },
            { label: 'Clicks · last 7 days', value: last7, icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-lg bg-background/40 border border-border/40 p-4"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {item.label}
                </div>
                <div className="text-2xl font-semibold mt-1">{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {posts.length === 0 && (
        <div className="tech-card border-0 rounded-xl p-6 text-sm text-muted-foreground">
          No tracked links yet. The next generated post will include one automatically.
        </div>
      )}

      {posts.map((post) => {
        const stats = statsFor(post.tracking_code);
        return (
          <div key={`${post.campaign}-${post.id}`} className="tech-card border-0 rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {post.label}
                </Badge>
                <span className="text-xs text-muted-foreground">{fmt(post.posted_at)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <MousePointerClick className="h-4 w-4 text-primary" /> {stats.total}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> {stats.unique}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.post_text}</p>
            {post.tracking_url && (
              <div className="flex items-center gap-2 rounded-lg bg-background/40 border border-border/40 p-2">
                <Link2 className="h-4 w-4 text-primary shrink-0" />
                <code className="text-xs truncate flex-1">{post.tracking_url}</code>
                <Button size="sm" variant="ghost" onClick={() => copy(post.tracking_url!)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {stats.last && (
              <div className="text-xs text-muted-foreground">Last click: {fmt(stats.last)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
