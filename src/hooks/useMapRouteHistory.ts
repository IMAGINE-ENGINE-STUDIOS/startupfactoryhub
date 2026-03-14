import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RouteHistoryItem {
  id: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  distance_meters?: number;
  duration_seconds?: number;
  avoid_tolls: boolean;
  created_at: string;
}

export function useMapRouteHistory() {
  const { user } = useAuth();
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);

  const loadRouteHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('route_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setRouteHistory((data as any[]) || []);
  }, [user]);

  useEffect(() => { loadRouteHistory(); }, [loadRouteHistory]);

  const saveRoute = useCallback(async (route: Omit<RouteHistoryItem, 'id' | 'created_at'>) => {
    if (!user) return;
    await supabase.from('route_history').insert({ ...route, user_id: user.id } as any);
    loadRouteHistory();
  }, [user, loadRouteHistory]);

  return { routeHistory, saveRoute, loadRouteHistory };
}
