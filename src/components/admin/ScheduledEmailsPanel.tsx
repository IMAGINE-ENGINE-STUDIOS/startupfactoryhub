import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock, Loader2, RefreshCw, Trash2, Play, CheckCircle, XCircle } from 'lucide-react';

interface ScheduledEmail {
  id: string;
  label: string;
  email_type: string;
  recipients: string[];
  scheduled_at: string;
  status: string;
  sent_count: number;
  error_count: number;
  last_error: string | null;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-[#FFB86A]/10 text-[#FFB86A] border-[#FFB86A]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  processing: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  sent: 'bg-[#2EF8A0]/10 text-[#2EF8A0] border-[#2EF8A0]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  failed: 'bg-[#FF3D6E]/10 text-[#FF3D6E] border-[#FF3D6E]/25 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
  cancelled: 'bg-white/[0.06] text-white/50 border-white/15 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
};

export const ScheduledEmailsPanel = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('id, label, email_type, recipients, scheduled_at, status, sent_count, error_count, last_error')
        .order('scheduled_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      setItems((data || []) as ScheduledEmail[]);
    } catch (err: any) {
      toast({ title: 'Failed to load schedule', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from('scheduled_emails').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast({ title: 'Could not cancel', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Scheduled email cancelled' });
    load();
  };

  const runDueNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-scheduled-emails', { body: {} });
      if (error) throw error;
      toast({ title: 'Scheduler run complete', description: `${data?.processed ?? 0} job(s) processed` });
      load();
    } catch (err: any) {
      toast({ title: 'Scheduler failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between font-['Space_Grotesk'] tracking-wide">
          <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Scheduled Emails</span>
          <span className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2 text-xs">
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button variant="outline" size="sm" onClick={runDueNow} disabled={running} className="h-7 px-2 text-xs">
              {running ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
              Run due now
            </Button>
          </span>
        </CardTitle>
        <CardDescription>Emails programmed in advance. The scheduler checks for due sends every 5 minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No emails scheduled yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-2 pr-3">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <Badge variant="outline" className={`${statusStyles[item.status] || ''}`}>{item.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.scheduled_at).toLocaleString()} · {item.recipients?.length || 0} recipient{(item.recipients?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    {(item.status === 'sent' || item.status === 'failed') && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        {item.error_count > 0
                          ? <XCircle className="h-3 w-3 text-[#FF3D6E]" />
                          : <CheckCircle className="h-3 w-3 text-[#2EF8A0]" />}
                        Sent: {item.sent_count} · Errors: {item.error_count}
                        {item.last_error ? ` · ${item.last_error}` : ''}
                      </p>
                    )}
                  </div>
                  {item.status === 'pending' && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => cancel(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledEmailsPanel;
