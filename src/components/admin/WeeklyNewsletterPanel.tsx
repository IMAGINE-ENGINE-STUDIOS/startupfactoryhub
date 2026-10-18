import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Newspaper, Loader2, RefreshCw, Send, Eye, Play, TrendingUp, CalendarClock, CheckCircle, XCircle,
  Power, PowerOff, AlertTriangle,
} from 'lucide-react';

interface FundingNews {
  id: string;
  startup_name: string | null;
  amount_text: string | null;
  round_type: string | null;
  summary: string | null;
  source_url: string;
  source_site: string | null;
  title: string;
}

interface SendLog {
  week_of: string;
  status: string;
  recipients_count: number;
  sent_count: number;
  error_count: number;
  last_error: string | null;
  completed_at: string | null;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-[#FFB86A]/10 text-[#FFB86A] border-[#FFB86A]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  processing: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  sent: 'bg-[#2EF8A0]/10 text-[#2EF8A0] border-[#2EF8A0]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  failed: 'bg-[#FF3D6E]/10 text-[#FF3D6E] border-[#FF3D6E]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
};

function currentWeekOf() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

function nextFriday1pmET() {
  const now = new Date();
  const d = new Date(now);
  const daysAhead = (5 - now.getUTCDay() + 7) % 7;
  d.setUTCDate(now.getUTCDate() + daysAhead);
  d.setUTCHours(18, 0, 0, 0);
  if (d.getTime() < now.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

export const WeeklyNewsletterPanel = () => {
  const { toast } = useToast();
  const [news, setNews] = useState<FundingNews[]>([]);
  const [log, setLog] = useState<SendLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const week = currentWeekOf();
      const [newsRes, logRes, settingRes] = await Promise.all([
        supabase
          .from('weekly_funding_news')
          .select('id, startup_name, amount_text, round_type, summary, source_url, source_site, title')
          .eq('week_of', week)
          .order('published_at', { ascending: false })
          .limit(10),
        supabase
          .from('newsletter_sends')
          .select('week_of, status, recipients_count, sent_count, error_count, last_error, completed_at')
          .order('week_of', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'weekly_newsletter_active')
          .maybeSingle(),
      ]);
      if (newsRes.error) throw newsRes.error;
      setNews((newsRes.data || []) as FundingNews[]);
      setLog((logRes.data as SendLog) || null);
      setIsActive((settingRes.data?.setting_value as any)?.active ?? true);
    } catch (err: any) {
      toast({ title: 'Could not load newsletter data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async () => {
    const nextActive = !isActive;
    setBusy('toggle');
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert(
          {
            setting_key: 'weekly_newsletter_active',
            setting_value: { active: nextActive },
            description: 'Master kill-switch for the weekly investment newsletter.',
          },
          { onConflict: 'setting_key' },
        );
      if (error) throw error;
      setIsActive(nextActive);
      toast({
        title: nextActive ? 'Newsletter activated' : 'Newsletter paused',
        description: nextActive
          ? 'The weekly brief will send automatically on the next scheduled Friday run.'
          : 'Automatic sends are now disabled. Manual preview and test still work.',
      });
    } catch (err: any) {
      toast({ title: 'Could not update setting', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const collect = async () => {
    setBusy('collect');
    try {
      const { data, error } = await supabase.functions.invoke('collect-funding-news', { body: {} });
      if (error) throw error;
      toast({ title: 'Funding radar refreshed', description: `${data?.collected ?? 0} new round(s) collected` });
      load();
    } catch (err: any) {
      toast({ title: 'Collection failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const preview = async () => {
    setBusy('preview');
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-newsletter', { body: { preview: true } });
      if (error) throw error;
      const win = window.open('', '_blank');
      if (win) { win.document.write(data.html); win.document.close(); }
    } catch (err: any) {
      toast({ title: 'Preview failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const sendTest = async () => {
    setBusy('test');
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) throw new Error('No email on the current session');
      const { error } = await supabase.functions.invoke('send-weekly-newsletter', { body: { testEmail: email } });
      if (error) throw error;
      toast({ title: 'Test sent', description: `Delivered to ${email}` });
    } catch (err: any) {
      toast({ title: 'Test send failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const runNow = async () => {
    if (!confirm('Send the Weekly Investment Brief to every subscribed member right now?')) return;
    setBusy('run');
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-newsletter', { body: { force: true } });
      if (error) throw error;
      toast({ title: 'Newsletter dispatched', description: `${data?.sent ?? 0} sent · ${data?.errors ?? 0} errors` });
      load();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const next = nextFriday1pmET();
  const paused = isActive === false;

  return (
    <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2 font-['Space_Grotesk'] tracking-wide">
          <span className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" /> Weekly Investment Newsletter
          </span>
          <span className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2 text-xs">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button
              variant={paused ? 'default' : 'outline'}
              size="sm"
              onClick={toggleActive}
              disabled={busy !== null || isActive === null}
              className="h-7 px-2 text-xs"
            >
              {busy === 'toggle' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : paused ? <Power className="h-3 w-3 mr-1" /> : <PowerOff className="h-3 w-3 mr-1" />}
              {paused ? 'Activate auto-send' : 'Pause auto-send'}
            </Button>
            <Button variant="outline" size="sm" onClick={collect} disabled={busy !== null} className="h-7 px-2 text-xs">
              {busy === 'collect' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <TrendingUp className="h-3 w-3 mr-1" />}
              Refresh radar
            </Button>
            <Button variant="outline" size="sm" onClick={preview} disabled={busy !== null} className="h-7 px-2 text-xs">
              {busy === 'preview' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={sendTest} disabled={busy !== null} className="h-7 px-2 text-xs">
              {busy === 'test' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
              Send test to me
            </Button>
            <Button size="sm" onClick={runNow} disabled={busy !== null} className="h-7 px-2 text-xs">
              {busy === 'run' ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
              Run now
            </Button>
          </span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 flex-wrap">
          <CalendarClock className="h-3 w-3" />
          Automatic every Friday at 1:00 PM EST · next run {next.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paused && (
          <div className="flex items-start gap-3 text-xs p-3 rounded-md bg-[#FF3D6E]/10 border border-[#FF3D6E]/25">
            <AlertTriangle className="h-4 w-4 text-[#FF3D6E] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#FF3D6E]">Auto-send is paused</p>
              <p className="text-muted-foreground mt-0.5">
                The weekly brief will not be sent automatically until you click <strong>Activate auto-send</strong>. Preview and test sends still work.
              </p>
            </div>
          </div>
        )}

        {log && (
          <div className="flex items-center gap-2 flex-wrap text-xs p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Badge variant="outline" className={statusStyles[log.status] || ''}>{log.status}</Badge>
            <span className="text-muted-foreground">Week of {log.week_of}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {log.error_count > 0 ? <XCircle className="h-3 w-3 text-[#FF3D6E]" /> : <CheckCircle className="h-3 w-3 text-[#2EF8A0]" />}
              {log.sent_count}/{log.recipients_count} sent · {log.error_count} errors
            </span>
            {log.last_error && <span className="text-muted-foreground truncate max-w-[280px]">{log.last_error}</span>}
          </div>
        )}

        <div>
          <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73] mb-2">
            Funding radar for this week ({news.length} round{news.length === 1 ? '' : 's'})
          </p>
          {news.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No funding rounds collected yet this week</p>
            </div>
          ) : (
            <ScrollArea className="h-[240px]">
              <div className="space-y-2 pr-3">
                {news.map(item => (
                  <a
                    key={item.id}
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{item.startup_name || item.title}</p>
                      {item.amount_text && <span className="text-sm font-semibold text-primary">{item.amount_text}</span>}
                      {item.round_type && <Badge variant="outline" className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider">{item.round_type}</Badge>}
                    </div>
                    {item.summary && <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>}
                    {item.source_site && <p className="text-[10px] text-muted-foreground mt-1">{item.source_site}</p>}
                  </a>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyNewsletterPanel;
