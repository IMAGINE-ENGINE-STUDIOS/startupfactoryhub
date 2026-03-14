import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchHistoryItem {
  id: string;
  query: string;
  result_type: string;
  result_name?: string;
  result_lat?: number;
  result_lng?: number;
  searched_at: string;
}

export function useMapSearchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('map_search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('searched_at', { ascending: false })
      .limit(20);
    setHistory((data as any[]) || []);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const addSearch = useCallback(async (item: Omit<SearchHistoryItem, 'id' | 'searched_at'>) => {
    if (!user) return;
    await supabase.from('map_search_history').insert({ ...item, user_id: user.id } as any);
    loadHistory();
  }, [user, loadHistory]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    await supabase.from('map_search_history').delete().eq('user_id', user.id);
    setHistory([]);
  }, [user]);

  return { history, addSearch, clearHistory, loadHistory };
}
