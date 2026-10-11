import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator' | 'admin' | 'member';

async function fetchRole(userId: string): Promise<AppRole | null> {
  const rpc = supabase.rpc('get_user_role', { _user_id: userId });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Role lookup timed out')), 7000));
  const { data, error } = (await Promise.race([rpc, timeout])) as { data: unknown; error: unknown };
  if (error) throw error;
  return (data as AppRole) ?? null;
}

// Cached + deduped: every caller shares one request, and returning to the dashboard is instant.
export const useUserRole = () => {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: () => fetchRole(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (a) => Math.pow(2, a) * 500,
  });
  return {
    role: user ? (q.data ?? null) : null,
    loading: !!user && q.isPending,
    error: (q.error as Error) ?? null,
    refetch: () => { q.refetch(); },
  };
};
