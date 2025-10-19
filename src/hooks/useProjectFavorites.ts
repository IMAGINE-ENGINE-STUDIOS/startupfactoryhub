import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useProjectFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load user's favorites
  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    const loadFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('project_favorites')
          .select('project_id')
          .eq('user_id', user.id);

        if (error) throw error;
        
        const favoriteIds = new Set(data?.map(f => f.project_id) || []);
        setFavorites(favoriteIds);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const toggleFavorite = useCallback(async (projectId: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    const isFavorite = favorites.has(projectId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('project_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('project_id', projectId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('project_favorites')
          .insert({
            user_id: user.id,
            project_id: projectId,
          });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(projectId));
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite");
    }
  }, [user, favorites]);

  const isFavorite = useCallback((projectId: string) => {
    return favorites.has(projectId);
  }, [favorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
  };
}
