import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MembershipStatus {
  isSubscribed: boolean;
  tier: string;
  loading: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const useMembershipStatus = () => {
  const query = useQuery({
    queryKey: ['membership-status'],
    queryFn: async (): Promise<{
      subscribed: boolean;
      tier: string;
      product_id: string | null;
      subscription_end: string | null;
      cancel_at_period_end: boolean;
    }> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { subscribed: false, tier: 'free', product_id: null, subscription_end: null, cancel_at_period_end: false };
      }

      const { data, error } = await supabase.functions.invoke('check-membership');
      
      if (error) {
        console.error('Membership check error:', error);
        return { subscribed: false, tier: 'free', product_id: null, subscription_end: null, cancel_at_period_end: false };
      }

      return {
        subscribed: data?.subscribed || false,
        tier: data?.tier || 'free',
        product_id: data?.product_id || null,
        subscription_end: data?.subscription_end || null,
        cancel_at_period_end: data?.cancel_at_period_end || false,
      };
    },
    staleTime: 1000 * 60, // 60s
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    isSubscribed: query.data?.subscribed || false,
    tier: query.data?.tier || 'free',
    loading: query.isLoading,
    productId: query.data?.product_id || null,
    subscriptionEnd: query.data?.subscription_end || null,
    cancelAtPeriodEnd: query.data?.cancel_at_period_end || false,
    refetch: query.refetch,
  } as MembershipStatus & { refetch: typeof query.refetch };
};
