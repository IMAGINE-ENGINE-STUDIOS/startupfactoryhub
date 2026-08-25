import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarClock, RefreshCw, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SyncRow = {
  id: string;
  direction: 'outbound' | 'inbound';
  status: string;
  post_text: string | null;
  linkedin_post_id: string | null;
  linkedin_event_urn: string | null;
  error_message: string | null;
  created_at: string;
};

type Settings = {
  id: string;
  enabled: boolean;
  outbound_enabled: boolean;
  inbound_enabled: boolean;
  min_hours_between_posts: number;
};

export default function EventSyncPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<SyncRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('sync-events-linkedin', {
      body: { action: 'status' },
    });
    setLoading(false);
    if (error) return;
    setSettings(data?.settings ?? null);
    setConnected(!!data?.connected);
    setHistory(data?.history ?? []);
  }

  async function toggle(patch: Partial<Settings>) {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    const { error } = await supabase.functions.invoke('sync-events-linkedin', {
      body: { action: 'toggle', ...patch },
    });
    if (error) { toast.error('Could not update setting'); void load(); }
  }

  async function syncNow() {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke('sync-events-linkedin', {
      body: { action: 'sync-now' },
    });
    setRunning(false);
    if (error) { toast.error('Sync failed'); return; }
    const out = data?.outbound ?? {};
    const inb = data?.inbound ?? {};
    if (out.posted) toast.success(`Posted event: ${out.event}`);
    else if (out.error) toast.error(out.error);
    else toast.info(`Outbound: ${out.skipped ?? 'nothing to post'}`);
    if (inb.error) toast.warning(`Inbound: ${inb.error}`);
    else if (typeof inb.imported === 'number') toast.info(`Imported ${inb.imported} LinkedIn event(s)`);
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="tech-card border-0 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
              <CalendarClock className="h-4 w-4" /> Events Sync
            </div>
            <h3 className="text-xl font-semibold mt-2">Two-Way LinkedIn Event Sync</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Upcoming public platform events are announced on the Company Page, and events owned by
              the page are imported back into the events tab.
            </p>
          </div>
          <Button size="sm" onClick={() => void syncNow()} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Sync now
          </Button>
        </div>

        {!connected && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            No LinkedIn Company Page is authorized — connect it above before events can sync.
          </div>
        )}

        {settings && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <Label htmlFor="ev-enabled" className="text-sm">Automation</Label>
              <Switch
                id="ev-enabled"
                checked={settings.enabled}
                onCheckedChange={(v) => void toggle({ enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <Label htmlFor="ev-out" className="text-sm">Post events to LinkedIn</Label>
              <Switch
                id="ev-out"
                checked={settings.outbound_enabled}
                onCheckedChange={(v) => void toggle({ outbound_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <Label htmlFor="ev-in" className="text-sm">Import LinkedIn events</Label>
              <Switch
                id="ev-in"
                checked={settings.inbound_enabled}
                onCheckedChange={(v) => void toggle({ inbound_enabled: v })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="tech-card border-0 rounded-xl p-6">
        <h4 className="font-medium mb-4">Sync history</h4>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && history.length === 0 && (
          <p className="text-sm text-muted-foreground">No event syncs yet.</p>
        )}
        <div className="space-y-3">
          {history.map((row) => (
            <div key={row.id} className="rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  {row.direction === 'outbound' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownLeft className="h-3 w-3" />
                  )}
                  {row.direction}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    row.status === 'posted' || row.status === 'imported'
                      ? 'border-emerald-500/40 text-emerald-400'
                      : 'border-red-500/40 text-red-400'
                  }
                >
                  {row.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </span>
              </div>
              {row.post_text && (
                <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground line-clamp-4">
                  {row.post_text}
                </pre>
              )}
              {row.error_message && (
                <p className="mt-2 text-xs text-red-400">{row.error_message}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
