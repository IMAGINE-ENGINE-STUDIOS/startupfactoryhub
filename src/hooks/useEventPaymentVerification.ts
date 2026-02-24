import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * On mount, if ?ticket_paid=1&session_id=xxx is in the URL,
 * verify the Stripe session and finalize the event ticket purchase.
 */
export function useEventPaymentVerification(onSuccess?: () => void) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const ticketPaid = searchParams.get('ticket_paid');
    const sessionId = searchParams.get('session_id');

    if (!ticketPaid || !sessionId || !user) return;

    // Clear params immediately
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('ticket_paid');
      next.delete('session_id');
      next.delete('ticket_cancelled');
      return next;
    });

    (async () => {
      try {
        toast({
          title: '⏳ Verifying payment…',
          description: 'Confirming your ticket purchase.',
        });

        const { data, error } = await supabase.functions.invoke('verify-event-payment', {
          body: { sessionId },
        });

        if (error) throw error;

        if (data?.paid) {
          toast({
            title: '🎫 Ticket purchased!',
            description: 'You are now registered for this event.',
          });
          onSuccess?.();
        } else {
          toast({
            title: 'Payment pending',
            description: 'Your payment is still processing.',
          });
        }
      } catch (err: any) {
        console.error('Event payment verification error:', err);
        toast({
          title: 'Verification issue',
          description: err.message || 'Unable to verify ticket payment.',
          variant: 'destructive',
        });
      }
    })();
  }, [user]);
}
