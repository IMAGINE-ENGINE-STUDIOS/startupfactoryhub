import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceType } from '@/hooks/useHubsSearch';

export interface RegusFilters {
  city?: string;
  country?: string;
  officeType?: string;
  search?: string;
}

export const useRegusLocations = (filters: RegusFilters, enabled = true) => {
  return useQuery({
    queryKey: ['regus-locations', filters],
    queryFn: async (): Promise<Workspace[]> => {
      let query = supabase
        .from('regus_locations')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`);
      }
      if (filters.officeType) {
        query = query.eq('office_type', filters.officeType);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,country.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Shape data to match Workspace interface for reuse with HubsLab components
      return (data || []).map((loc: any): Workspace => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        country: loc.country,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        workspace_types: [loc.office_type as WorkspaceType],
        amenities: loc.amenities || [],
        hourly_rate_min: null, // No pricing — subscription covers access
        hourly_rate_max: null,
        daily_rate_min: null,
        daily_rate_max: null,
        rating: loc.rating ? Number(loc.rating) : null,
        image_url: loc.image_url,
        images: loc.images || [],
        videos: loc.videos || [],
        provider: 'internal' as const,
        external_venue_id: undefined,
      }));
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};
