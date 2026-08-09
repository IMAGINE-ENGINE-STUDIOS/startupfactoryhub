import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ScheduleControls from './ScheduleControls';
import DedupeControls from './DedupeControls';
import {
  Loader2,
  Linkedin,
  CalendarClock,
  Send,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Settings {
  id: string;
  is_enabled: boolean;
  deadline: string;
  startups_per_batch: number;
  apply_url: string;
  interval_days: number;
  post_hour_local: number;
  dedupe_lookback_posts: number | null;
  dedupe_window_days: number | null;
  similarity_threshold: number | null;
  last_posted_at: string | null;
}

interface CampaignPost {
  id: string;
  posted_at: string | null;
  created_at: string;
  days_left: number | null;
  angle: string | null;
  post_text: string | null;
  linkedin_post_id: string | null;
  status: string;
  error_message: string | null;
}

interface PreviewData {
  post_text: string;
  banner_data_url: string;
  days_left: number;
  angle: string;
}

export default function MVPCampaignPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('mvp_campaign_settings').select('*').order('created_at').limit(1).maybeSingle(),
      supabase
        .from('mvp_campaign_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12),
    ]);
    setSettings(s as Settings | null);
    setPosts((p as CampaignPost[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const daysLeft = settings
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${settings.deadline}T23:59:59Z`).getTime() - Date.now()) / 86400000,
        ),
      )
    : 0;

  const toggle = async (value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, is_enabled: value });
    const { error } = await supabase
      .from('mvp_campaign_settings')
      .update({ is_enabled: value })
      .eq('id', settings.id);
    if (error) {
      toast.error('Could not update campaign');
      setSettings({ ...settings, is_enabled: !value });
    } else {
      toast.success(value ? 'Auto-posting enabled' : 'Auto-posting paused');
    }
  };

  const describeError = async (error: unknown): Promise<string> => {
    const err = error as { message?: string; context?: Response };
    let detail = err?.message || 'Request failed';
    if (err?.context && typeof err.context.text === 'function') {
      try {
        const raw = await err.context.text();
        const parsed = JSON.parse(raw) as { error?: string };
        detail = parsed?.error || raw || detail;
      } catch {
        /* keep default message */
      }
    }
    return detail;
  };

  const runPreview = async () => {
    setPreviewing(true);
    setPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke('post-mvp-program', {
        body: { preview: true },
      });
      if (error) throw new Error(await describeError(error));
      if (data?.error) throw new Error(data.error);
      setPreview(data as PreviewData);
    } catch (err) {
      toast.error((err as Error).message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const postNow = async () => {
    setPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-mvp-program', {
        body: { force: true },
      });
      if (error) throw new Error(await describeError(error));
      if (data?.error) throw new Error(data.error);
      toast.success('Posted to LinkedIn and the SFH feed');
      setPreview(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Post failed');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="tech-card border-0 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0077B5]" />
            <h3 className="text-xl font-bold">MVP Program Auto-Posting</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            A unique AI-written announcement with a live countdown banner is published to the
            Startup Factory Hub LinkedIn page and the SFH feed on the cadence you set below.
          </p>
        </div>
        {settings && (
          <div className="flex items-center gap-3">
            <Label htmlFor="mvp-campaign-toggle" className="text-sm">
              {settings.is_enabled ? 'Active' : 'Paused'}
            </Label>
            <Switch
              id="mvp-campaign-toggle"
              checked={settings.is_enabled}
              onCheckedChange={toggle}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !settings ? (
        <p className="text-sm text-muted-foreground">Campaign settings not found.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Days left', value: `${daysLeft}` },
              {
                label: 'Deadline',
                value: new Date(`${settings.deadline}T12:00:00Z`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                }),
              },
              { label: 'Startups / batch', value: `${settings.startups_per_batch}` },
              {
                label: 'Last posted',
                value: settings.last_posted_at
                  ? new Date(settings.last_posted_at).toLocaleDateString()
                  : '—',
              },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border/50 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <ScheduleControls
            table="mvp_campaign_settings"
            settingsId={settings.id}
            mode="interval"
            hour={settings.post_hour_local ?? 9}
            intervalDays={settings.interval_days ?? 2}
            onSaved={load}
          />

          <DedupeControls
            table="mvp_campaign_settings"
            settingsId={settings.id}
            lookbackPosts={settings.dedupe_lookback_posts ?? 12}
            windowDays={settings.dedupe_window_days ?? 45}
            threshold={Number(settings.similarity_threshold ?? 0.62)}
            onSaved={load}
          />

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={runPreview} disabled={previewing}>
              {previewing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Preview next post
            </Button>
            <Button onClick={postNow} disabled={posting}>
              {posting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post now
            </Button>
            <Button variant="ghost" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {preview && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-background/40 p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Angle: {preview.angle} · {preview.days_left} days left
                </span>
              </div>
              <img
                src={preview.banner_data_url}
                alt="MVP Program countdown banner preview"
                className="w-full rounded-md border border-border/50"
              />
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {preview.post_text}
              </pre>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">Recent auto-posts</p>
            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <div className="space-y-2">
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/40 p-3"
                  >
                    {p.status === 'posted' ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{p.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.posted_at || p.created_at).toLocaleString()}
                        </span>
                        {p.days_left !== null && (
                          <span className="text-xs text-muted-foreground">
                            {p.days_left} days left
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
                        {p.error_message || p.post_text || p.angle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
