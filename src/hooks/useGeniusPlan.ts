import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GeniusUsage {
  plan: string;
  monthly_credits: number;
  balance: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  has_customer: boolean;
  // legacy fields kept for older UI
  limit: number;
  turns_used: number;
  input_tokens: number;
  output_tokens: number;
  period_start: string | null;
}

const FALLBACK: GeniusUsage = {
  plan: 'free',
  monthly_credits: 0,
  balance: 0,
  current_period_end: null,
  cancel_at_period_end: false,
  has_customer: false,
  limit: 0,
  turns_used: 0,
  input_tokens: 0,
  output_tokens: 0,
  period_start: null,
};

export const useGeniusPlan = () => {
  const query = useQuery({
    queryKey: ['genius-plan'],
    queryFn: async (): Promise<GeniusUsage> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return FALLBACK;
      const { data, error } = await supabase.functions.invoke('check-genius-plan');
      if (error) {
        console.error('Genius plan check error:', error);
        return FALLBACK;
      }
      const d = { ...FALLBACK, ...(data as GeniusUsage) };
      // Older UI shows "limit - turns_used" as remaining credits.
      return { ...d, limit: d.balance, turns_used: 0 };
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60,
    retry: 1,
  });

  // Refresh right after returning from checkout.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('credits') === 'success') query.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    usage: query.data ?? FALLBACK,
    loading: query.isLoading || query.isFetching,
    refetch: query.refetch,
  };
};
