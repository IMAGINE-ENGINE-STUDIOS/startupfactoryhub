import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedLocation {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  place_type: string;
  icon: string;
  created_at: string;
}

export function useMapFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setFavorites((data as any[]) || []);
    } catch { /* */ }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const addFavorite = useCallback(async (loc: Omit<SavedLocation, 'id' | 'created_at'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('saved_locations')
      .insert({ ...loc, user_id: user.id } as any)
      .select()
      .single();
    if (!error && data) {
      setFavorites(prev => [data as any, ...prev]);
    }
    return { data, error };
  }, [user]);

  const removeFavorite = useCallback(async (id: string) => {
    await supabase.from('saved_locations').delete().eq('id', id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  }, []);

  return { favorites, isLoading, addFavorite, removeFavorite, loadFavorites };
}
