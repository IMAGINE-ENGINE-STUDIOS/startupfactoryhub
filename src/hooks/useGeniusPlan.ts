import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GeniusUsage {
  plan: string;
  limit: number;
  turns_used: number;
  input_tokens: number;
  output_tokens: number;
  current_period_end: string | null;
  period_start: string | null;
}

const FALLBACK: GeniusUsage = {
  plan: 'free',
  limit: 50,
  turns_used: 0,
  input_tokens: 0,
  output_tokens: 0,
  current_period_end: null,
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
      return { ...FALLBACK, ...(data as GeniusUsage) };
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    usage: query.data ?? FALLBACK,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
