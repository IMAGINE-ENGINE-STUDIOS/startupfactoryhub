import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * On mount, if ?village_created=1&session_id=xxx is in the URL,
 * verify the Stripe session and finalize the village room creation.
 */
export function useVillagePaymentVerification(onSuccess?: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const villageCreated = searchParams.get('village_created');
    const sessionId = searchParams.get('session_id');

    if (!villageCreated || !sessionId || !user) return;

    // Clear params immediately so we don't re-verify on re-render
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('village_created');
      next.delete('session_id');
      return next;
    });

    (async () => {
      try {
        toast({
          title: '⏳ Verifying payment…',
          description: 'Setting up your village. This may take a moment.',
        });

        const { data, error } = await supabase.functions.invoke('verify-village-payment', {
          body: { sessionId },
        });

        if (error) throw error;

        if (data?.paid) {
          toast({
            title: '🏘️ Village founded!',
            description: 'Your new village is live and ready to welcome residents.',
          });
          onSuccess?.();
        } else {
          toast({
            title: 'Payment pending',
            description: 'Your payment is still processing. The village will appear shortly.',
          });
        }
      } catch (err: any) {
        console.error('Village verification error:', err);
        toast({
          title: 'Verification issue',
          description: err.message || 'Unable to verify village payment. Please contact support if your village does not appear.',
          variant: 'destructive',
        });
      }
    })();
  }, [user]); // only run when user becomes available
}
