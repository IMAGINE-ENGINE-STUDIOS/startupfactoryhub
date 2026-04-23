import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator' | 'admin' | 'member';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchRole = useCallback(async (attempt: number = 0): Promise<AppRole | null> => {
    try {
      // Use the secure get_user_role function
      const { data, error: rpcError } = await supabase
        .rpc('get_user_role', { _user_id: user!.id });

      if (rpcError) {
        throw rpcError;
      }

      return data as AppRole;
    } catch (err) {
      // Retry with exponential backoff (max 3 attempts)
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchRole(attempt + 1);
      }
      throw err;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const doFetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchedRole = await fetchRole(0);
        
        if (!cancelled) {
          setRole(fetchedRole);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        if (!cancelled) {
          // Set role to null on error - this is a genuine "no role" situation after retries
          setRole(null);
          setError(err instanceof Error ? err : new Error('Failed to fetch user role'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [user, fetchRole, retryCount]);

  // Function to manually retry fetching the role
  const refetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return { role, loading, error, refetch };
};
