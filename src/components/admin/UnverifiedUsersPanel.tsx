import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MailWarning, Send, Loader2 } from 'lucide-react';

interface BackfillResult {
  total?: number;
  sent?: number;
  mvpSent?: number;
  failed?: number;
  count?: number;
  dryRun?: boolean;
}

export const UnverifiedUsersPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<'check' | 'send' | null>(null);
  const [result, setResult] = useState<BackfillResult | null>(null);

  const run = async (dryRun: boolean) => {
    setLoading(dryRun ? 'check' : 'send');
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: { backfill: true, dryRun, limit: 500 },
      });
      if (error) throw error;
      setResult(data as BackfillResult);
      toast({
        title: dryRun ? 'Unverified users counted' : '✅ Verification emails sent',
        description: dryRun
          ? `${data?.count ?? 0} users have not verified their email`
          : `Sent ${data?.sent ?? 0} verification emails · ${data?.mvpSent ?? 0} MVP program emails`,
      });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
          <MailWarning className="h-4 w-4 text-[#FFB86A]" />
          Unverified Accounts
        </CardTitle>
        <CardDescription>
          Re-send the branded verification email to every user who signed up but never confirmed their address.
          MVP Program signups also receive the application email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => run(true)} disabled={loading !== null}>
            {loading === 'check' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Count unverified
          </Button>
          <Button size="sm" onClick={() => run(false)} disabled={loading !== null}>
            {loading === 'send' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send verification emails
          </Button>
        </div>

        {result && (
          <div className="flex flex-wrap gap-2 text-xs">
            {typeof result.count === 'number' && (
              <Badge variant="outline" className="bg-[#FFB86A]/10 text-[#FFB86A] border-[#FFB86A]/25 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">
                {result.count} unverified
              </Badge>
            )}
            {typeof result.sent === 'number' && (
              <Badge variant="outline" className="bg-[#2EF8A0]/10 text-[#2EF8A0] border-[#2EF8A0]/25 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">
                {result.sent} verification emails sent
              </Badge>
            )}
            {typeof result.mvpSent === 'number' && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {result.mvpSent} MVP emails sent
              </Badge>
            )}
            {typeof result.failed === 'number' && result.failed > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {result.failed} failed
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
