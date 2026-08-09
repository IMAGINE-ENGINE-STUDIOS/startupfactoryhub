import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ScheduleControls from './ScheduleControls';
import {
  Loader2,
  Linkedin,
  CalendarClock,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  History,
  Sparkles,
  Eye,
} from 'lucide-react';

interface Settings {
  id: string;
  is_enabled: boolean;
  landing_url: string;
  auto_publish_unreviewed: boolean;
  post_days: number[] | null;
  post_hour_local: number | null;
  last_posted_at: string | null;
}

interface CampaignPost {
  id: string;
  post_text: string | null;
  angle: string | null;
  status: string;
  generated_at: string;
  scheduled_for: string | null;
  posted_at: string | null;
  linkedin_post_id: string | null;
  error_message: string | null;
}

interface PreviewData {
  source: 'queued' | 'generated';
  post_id: string | null;
  post_text: string;
  angle: string | null;
  hashtags: string[];
  scheduled_for: string | null;
  landing_url: string;
  tracking_url?: string | null;
  tracking_code?: string | null;
  auto_publish: boolean;
  is_enabled: boolean;
}



const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-primary/15 text-primary border-primary/30',
  published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Auto-Scheduled',
  approved: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      }) + ' ET'
    : '—';

export default function PartnersCampaignPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [org, setOrg] = useState<{ org_urn?: string; org_name?: string; expires_at?: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [token, setToken] = useState('');
  const [urn, setUrn] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const invoke = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('post-partners-campaign', {
      body: payload,
    });
    if (error) {
      let detail = error.message;
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.text === 'function') {
        try {
          const raw = await ctx.text();
          const parsed = JSON.parse(raw) as { error?: string };
          detail = parsed?.error || raw || detail;
        } catch {
          /* keep default message */
        }
      }
      throw new Error(detail);
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase
        .from('partners_campaign_settings')
        .select('*')
        .order('created_at')
        .limit(1)
        .maybeSingle(),
      supabase
        .from('partners_campaign_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    setSettings(s as Settings | null);
    setPosts((p as CampaignPost[]) || []);
    try {
      const res = (await invoke({ action: 'credentials-status' })) as {
        connected: boolean;
        org: typeof org;
        slots: string[];
      };
      setOrg(res.connected ? res.org : null);
      setSlots(res.slots || []);
    } catch {
      /* not admin or function unavailable */
    }
    setLoading(false);
  }, [invoke]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, values: Partial<CampaignPost>) => {
    const { error } = await supabase.from('partners_campaign_posts').update(values).eq('id', id);
    if (error) return toast.error(error.message);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...values } : p)));
  };

  const toggleCampaign = async (value: boolean) => {
    if (!settings) return;
    const { error } = await supabase
      .from('partners_campaign_settings')
      .update({ is_enabled: value })
      .eq('id', settings.id);
    if (error) return toast.error(error.message);
    setSettings({ ...settings, is_enabled: value });
  };

  const run = async (key: string, fn: () => Promise<unknown>, done?: string) => {
    setBusy(key);
    try {
      await fn();
      if (done) toast.success(done);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const queue = posts.filter((p) => p.status === 'draft' || p.status === 'approved');
  const history = posts.filter((p) => p.status === 'published' || p.status === 'failed');

  if (loading) {
    return (
      <div className="tech-card border-0 rounded-xl p-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mission control header */}
      <div className="tech-card border-0 rounded-xl p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
              <Linkedin className="h-4 w-4" /> Accelerator-as-a-Service Campaign
            </div>
            <h3 className="text-2xl font-semibold mt-2">Partners LinkedIn Automation</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Publishes to the Startup Factory Hub company page on the schedule you set below,
              linking to /forpartners.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="partners-campaign-toggle" className="text-sm text-muted-foreground">
              {settings?.is_enabled ? 'Active' : 'Paused'}
            </Label>
            <Switch
              id="partners-campaign-toggle"
              checked={!!settings?.is_enabled}
              onCheckedChange={toggleCampaign}
            />
          </div>
        </div>

        <div className="relative grid gap-4 sm:grid-cols-3 mt-6">
          {[
            { label: 'Next slot', value: fmt(slots[0] ?? null) },
            { label: 'Then', value: fmt(slots[1] ?? null) },
            { label: 'Last published', value: fmt(settings?.last_posted_at ?? null) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-background/40 border border-border/40 p-4">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {item.label}
              </div>
              <div className="text-sm font-medium mt-1">{item.value}</div>
            </div>
          ))}
        </div>

        {settings && (
          <div className="relative mt-6">
            <ScheduleControls
              table="partners_campaign_settings"
              settingsId={settings.id}
              mode="weekdays"
              hour={settings.post_hour_local ?? 9}
              postDays={settings.post_days ?? [1, 3]}
              onSaved={load}
            />
          </div>
        )}

        <div className="relative flex flex-wrap gap-3 mt-6">
          <Button
            disabled={busy !== null}
            onClick={() =>
              run('preview', async () => {
                const data = (await invoke({ action: 'preview' })) as PreviewData;
                setPreview(data);
              })
            }
          >
            {busy === 'preview' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview next post
          </Button>
          <Button
            variant="outline"
            disabled={busy !== null}
            onClick={() =>
              run(
                'generate',
                () => invoke({ action: 'generate', scheduled_for: slots[0] }),
                'Draft generated',
              )
            }
          >
            {busy === 'generate' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate next post
          </Button>
          {!org && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 self-center">
              <AlertTriangle className="h-3 w-3 mr-1" /> LinkedIn credentials missing
            </Badge>
          )}
          {org && (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 self-center">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {org.org_name || org.org_urn}
            </Badge>
          )}
        </div>

        {preview && (
          <div className="relative mt-6 rounded-xl border border-primary/25 bg-background/50 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-widest text-primary">
                Exact copy publishing next · {fmt(preview.scheduled_for)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-border/50 text-muted-foreground">
                  {preview.source === 'queued' ? 'Queued draft' : 'Fresh generation'}
                </Badge>
                {preview.auto_publish && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-400"
                  >
                    Auto-publish on
                  </Badge>
                )}
              </div>
            </div>
            {preview.angle && (
              <div className="text-xs text-muted-foreground">Angle: {preview.angle}</div>
            )}
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
              {preview.post_text}
            </pre>
            {preview.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preview.hashtags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-primary/30 text-primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {preview.tracking_url && (
              <div className="rounded-lg bg-background/40 border border-border/40 p-3 text-xs">
                <div className="uppercase tracking-widest text-muted-foreground mb-1">
                  Tracked link
                </div>
                <code className="break-all">{preview.tracking_url}</code>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  run('preview', async () => {
                    const data = (await invoke({
                      action: preview.post_id ? 'regenerate' : 'preview',
                      id: preview.post_id ?? undefined,
                    })) as PreviewData & { post?: CampaignPost };
                    if (data.post) {
                      setPreview({
                        ...preview,
                        post_text: data.post.post_text ?? '',
                        angle: data.post.angle,
                        hashtags: (data.post.post_text?.match(/#[\p{L}\p{N}_]+/gu) ?? []) as string[],
                      });
                    } else {
                      setPreview(data);
                    }
                  })
                }
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Regenerate copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                Close preview
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* Approval queue */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
          <CalendarClock className="h-4 w-4" /> Upcoming queue · auto-publishes without approval
        </div>
        {queue.length === 0 && (
          <div className="tech-card border-0 rounded-xl p-6 text-sm text-muted-foreground">
            Nothing queued. A post will be generated and published automatically at the next slot.
          </div>
        )}
        {queue.map((post) => (
          <div key={post.id} className="tech-card border-0 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-medium">{fmt(post.scheduled_for)}</div>
              <Badge variant="outline" className={STATUS_STYLE[post.status]}>
                {STATUS_LABEL[post.status]}
              </Badge>
            </div>
            {post.angle && (
              <div className="text-xs text-muted-foreground">Angle: {post.angle}</div>
            )}
            <Textarea
              value={editing[post.id] ?? post.post_text ?? ''}
              onChange={(e) => setEditing((prev) => ({ ...prev, [post.id]: e.target.value }))}
              rows={10}
              className="text-sm leading-relaxed bg-background/40"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null || editing[post.id] === undefined}
                onClick={() =>
                  run(`save-${post.id}`, () => patch(post.id, { post_text: editing[post.id] }), 'Saved')
                }
              >
                Save edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() =>
                  run(
                    `regen-${post.id}`,
                    async () => {
                      await invoke({ action: 'regenerate', id: post.id });
                      setEditing((prev) => {
                        const next = { ...prev };
                        delete next[post.id];
                        return next;
                      });
                    },
                    'Regenerated',
                  )
                }
              >
                {busy === `regen-${post.id}` ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy !== null}
                onClick={() =>
                  run(
                    `now-${post.id}`,
                    () => invoke({ action: 'publish-now', id: post.id }),
                    'Published to LinkedIn',
                  )
                }
              >
                <Send className="h-4 w-4 mr-2" /> Publish now
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
          <History className="h-4 w-4" /> History
        </div>
        <div className="tech-card border-0 rounded-xl divide-y divide-border/40">
          {history.length === 0 && (
            <div className="p-5 text-sm text-muted-foreground">No posts published yet.</div>
          )}
          {history.map((post) => (
            <div key={post.id} className="p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium">
                  {fmt(post.posted_at ?? post.scheduled_for)}
                </div>
                <div className="flex items-center gap-2">
                  {post.linkedin_post_id && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {post.linkedin_post_id}
                    </span>
                  )}
                  <Badge variant="outline" className={STATUS_STYLE[post.status]}>
                    {STATUS_LABEL[post.status]}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                {post.post_text}
              </p>
              {post.error_message && (
                <p className="text-xs text-destructive">{post.error_message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="tech-card border-0 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground">
          <KeyRound className="h-4 w-4" /> LinkedIn credentials
        </div>
        <p className="text-xs text-muted-foreground">
          Paste an already-approved Community Management API access token with the
          w_organization_social scope. LinkedIn tokens expire roughly every 60 days and must be
          renewed here. Post copy is generated with the built-in AI gateway, so no separate LLM key
          is required.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="li-token" className="text-xs">
              Access token
            </Label>
            <Input
              id="li-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="AQV..."
              className="bg-background/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="li-urn" className="text-xs">
              Organization URN
            </Label>
            <Input
              id="li-urn"
              value={urn}
              onChange={(e) => setUrn(e.target.value)}
              placeholder="urn:li:organization:12345678"
              className="bg-background/40"
            />
          </div>
        </div>
        <Button
          disabled={busy !== null || !token || !urn}
          onClick={() =>
            run(
              'creds',
              async () => {
                await invoke({ action: 'set-credentials', access_token: token, org_urn: urn });
                setToken('');
                setUrn('');
              },
              'LinkedIn credentials saved',
            )
          }
        >
          {busy === 'creds' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save credentials
        </Button>
        {org?.expires_at && (
          <p className="text-xs text-muted-foreground">
            Current token marked as expiring {new Date(org.expires_at).toLocaleDateString()}.
          </p>
        )}
      </div>
    </div>
  );
}
