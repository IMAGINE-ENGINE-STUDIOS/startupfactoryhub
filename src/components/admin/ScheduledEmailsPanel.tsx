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
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sent: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-muted text-muted-foreground',
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
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
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
                      <Badge variant="outline" className={`text-xs ${statusStyles[item.status] || ''}`}>{item.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.scheduled_at).toLocaleString()} · {item.recipients?.length || 0} recipient{(item.recipients?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    {(item.status === 'sent' || item.status === 'failed') && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        {item.error_count > 0
                          ? <XCircle className="h-3 w-3 text-red-400" />
                          : <CheckCircle className="h-3 w-3 text-green-400" />}
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
