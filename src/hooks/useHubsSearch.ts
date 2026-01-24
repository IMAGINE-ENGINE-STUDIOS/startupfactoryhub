import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WorkspaceType = 'hot_desk' | 'private_office' | 'meeting_room' | 'coworking' | 'event_space';

export interface Workspace {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  workspace_types: WorkspaceType[];
  amenities: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  daily_rate_min: number | null;
  daily_rate_max: number | null;
  rating: number | null;
  image_url: string | null;
  images?: string[];
  provider: 'internal' | 'liquidspace' | 'mock';
  external_venue_id?: string;
}

export interface WorkspaceFilters {
  city?: string;
  country?: string;
  workspaceType?: WorkspaceType[];
  amenities?: string[];
  minCapacity?: number;
  maxBudget?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export const useHubsSearch = (filters: WorkspaceFilters) => {
  return useQuery({
    queryKey: ['hubs-workspaces', filters],
    queryFn: async (): Promise<Workspace[]> => {
      try {
        // Get current session for auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No session - returning empty results');
          return [];
        }

        // Call the Edge Function
        const { data, error } = await supabase.functions.invoke('hub-search-workspaces', {
          body: { filters },
        });

        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }

        // Return workspaces from Edge Function
        return (data?.workspaces || []) as Workspace[];
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        // Return empty array on error instead of throwing
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

export const useWorkspaceLocations = () => {
  return useQuery({
    queryKey: ['workspace-locations'],
    queryFn: async () => {
      // Get unique cities from resources
      const { data, error } = await supabase
        .from('resources')
        .select('city, country')
        .eq('is_verified', true)
        .in('resource_type', ['coworking', 'office', 'venue'])
        .not('city', 'is', null);

      if (error) throw error;

      // Deduplicate cities
      const uniqueCities = Array.from(
        new Map(data?.map(r => [`${r.city}-${r.country}`, { city: r.city, country: r.country }])).values()
      );

      return uniqueCities;
    },
  });
};
