import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Shows whether the LinkedIn Company Page is authorized for auto-posting.
 * Without an active org token every scheduled campaign fails with
 * "No LinkedIn Company Page connected".
 */
export default function LinkedInConnectionCard() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [canPostToPage, setCanPostToPage] = useState(false);
  const [blocker, setBlocker] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => { void check(); }, []);

  async function check() {
    setChecking(true);
    try {
      const { data } = await supabase.functions.invoke('linkedin-org-auth', {
        body: { action: 'check-connection' },
      });
      setConnected(!!data?.isConnected);
      setCanPostToPage(data?.canPostToPage === true);
      setBlocker(data?.blocker ?? null);
      setOrgName(data?.org?.org_name ?? null);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }

  async function connect() {
    const { data, error } = await supabase.functions.invoke('linkedin-org-auth', {
      body: { action: 'get-auth-url', origin: window.location.origin },
    });
    if (error || !data?.authUrl) {
      toast.error('Failed to start LinkedIn authorization');
      return;
    }
    const w = window.open(data.authUrl, 'linkedin-org', 'width=600,height=700');
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'linkedin-org-success') {
        toast.success('Company Page connected — campaigns can post now');
        void check();
        window.removeEventListener('message', onMsg);
        w?.close();
      }
      if (e.data?.type === 'linkedin-org-error') {
        toast.error(e.data?.message || 'LinkedIn connection failed');
        window.removeEventListener('message', onMsg);
      }
    };
    window.addEventListener('message', onMsg);
  }

  return (
    <div className="tech-card border-0 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Linkedin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">LinkedIn Publishing</span>
            {canPostToPage && (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Page publishing ready
              </Badge>
            )}
            {!canPostToPage && connected !== null && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                <AlertTriangle className="h-3 w-3 mr-1" /> Page publishing blocked
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {canPostToPage
              ? `Posting directly as ${orgName ?? 'the Startup Factory Hub Company Page'}. Scheduled campaigns publish automatically.`
              : blocker ?? 'Campaigns cannot publish until the Startup Factory Hub Company Page is authorized.'}
          </p>

        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void check()} disabled={checking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Recheck
        </Button>
        <Button size="sm" onClick={() => void connect()}>
          <Linkedin className="h-4 w-4 mr-2" />
          {connected ? 'Reauthorize Page' : 'Connect Company Page'}
        </Button>
      </div>
    </div>
  );
}
