import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SearchResult {
  id: string;
  title: string;
  project_type: string;
  content: any;
  rank: number;
  updated_at: string;
  last_accessed_at: string;
}

export function useProjectSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_lightpaper_projects', {
        search_query: query,
        user_id_param: user.id,
      });

      if (error) throw error;
      setResults((data as SearchResult[]) || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search projects");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    loading,
    search,
    clearResults,
  };
}
