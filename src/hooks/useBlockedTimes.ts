import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BlockedTime {
  id: string;
  user_id: string;
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export const useBlockedTimes = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedTimes = async () => {
    if (!targetUserId) { setBlockedTimes([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_blocked_times')
        .select('*')
        .eq('user_id', targetUserId)
        .order('blocked_date', { ascending: true });
      if (error) throw error;
      setBlockedTimes(data || []);
    } catch (err) {
      console.error('Error fetching blocked times:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlockedTimes(); }, [targetUserId]);

  const addBlockedTime = async (params: { blocked_date: string; start_time?: string | null; end_time?: string | null; reason?: string | null }) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const { data, error } = await supabase
        .from('calendar_blocked_times')
        .insert({
          user_id: user.id,
          blocked_date: params.blocked_date,
          start_time: params.start_time || null,
          end_time: params.end_time || null,
          reason: params.reason || null,
        })
        .select()
        .single();
      if (error) throw error;
      fetchBlockedTimes();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteBlockedTime = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_blocked_times')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchBlockedTimes();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { blockedTimes, loading, addBlockedTime, deleteBlockedTime, refetch: fetchBlockedTimes };
};
