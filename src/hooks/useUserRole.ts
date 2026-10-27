// Credits: Imagine Engine Studios Corp
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator' | 'admin' | 'member';

const VIEW_KEY = (userId: string) => `sfh-active-role:${userId}`;

/** Role view the user picked (for accounts holding several roles, e.g. admin + startup). */
export const getPreferredRole = (userId: string): AppRole | null => {
  try { return (localStorage.getItem(VIEW_KEY(userId)) as AppRole) || null; } catch { return null; }
};
export const setPreferredRole = (userId: string, role: AppRole) => {
  try { localStorage.setItem(VIEW_KEY(userId), role); } catch { /* storage unavailable */ }
};

async function fetchRoles(userId: string): Promise<{ primary: AppRole | null; all: AppRole[] }> {
  const rpc = supabase.rpc('get_user_role', { _user_id: userId });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Role lookup timed out')), 7000));
  const { data, error } = (await Promise.race([rpc, timeout])) as { data: unknown; error: unknown };
  if (error) throw error;
  const primary = (data as AppRole) ?? null;
  const { data: rows } = await supabase.from('user_roles').select('role').eq('user_id', userId);
  const all = Array.from(new Set([...(rows || []).map((r: any) => r.role as AppRole), ...(primary ? [primary] : [])]));
  return { primary, all };
}

// Cached + deduped: every caller shares one request, and returning to the dashboard is instant.
export const useUserRole = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: () => fetchRoles(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (a) => Math.pow(2, a) * 500,
  });
  const preferred = user ? getPreferredRole(user.id) : null;
  const all = q.data?.all ?? [];
  const role = user ? (preferred && all.includes(preferred) ? preferred : q.data?.primary ?? null) : null;
  return {
    role,
    roles: all,
    loading: !!user && q.isPending,
    error: (q.error as Error) ?? null,
    refetch: () => { q.refetch(); },
    switchRole: (r: AppRole) => {
      if (!user) return;
      setPreferredRole(user.id, r);
      qc.invalidateQueries({ queryKey: ['user-role', user.id] });
    },
  };
};
