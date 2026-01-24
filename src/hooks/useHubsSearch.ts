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
  provider: 'internal' | 'liquidspace';
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

const WORKSPACE_TYPE_ALLOWLIST: WorkspaceType[] = ['hot_desk', 'private_office', 'meeting_room', 'coworking', 'event_space'];

// Hotel exclusion keywords
const HOTEL_KEYWORDS = [
  'hotel', 'hilton', 'marriott', 'hyatt', 'sheraton', 'westin', 
  'ritz', 'radisson', 'holiday inn', 'best western', 'doubletree',
  'courtyard', 'fairfield', 'hampton', 'embassy suites', 'crowne plaza',
  'intercontinental', 'four seasons', 'w hotel', 'boutique hotel', 'motel'
];

const isHotelVenue = (name: string, address: string): boolean => {
  const searchText = `${name} ${address}`.toLowerCase();
  return HOTEL_KEYWORDS.some(keyword => searchText.includes(keyword));
};

export const useHubsSearch = (filters: WorkspaceFilters) => {
  return useQuery({
    queryKey: ['hubs-workspaces', filters],
    queryFn: async (): Promise<Workspace[]> => {
      // First try to get from cache
      let query = supabase
        .from('hub_venues_cache')
        .select('*')
        .eq('is_professional', true)
        .eq('is_hotel', false);

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.country) {
        query = query.ilike('country', `%${filters.country}%`);
      }

      if (filters.maxBudget) {
        query = query.lte('hourly_rate_min', filters.maxBudget);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      const { data: cachedVenues, error: cacheError } = await query;

      // Also fetch from resources (coworking/office types)
      let resourceQuery = supabase
        .from('resources')
        .select('*')
        .eq('is_verified', true)
        .in('resource_type', ['coworking', 'office', 'venue'])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (filters.city) {
        resourceQuery = resourceQuery.ilike('city', `%${filters.city}%`);
      }

      if (filters.search) {
        resourceQuery = resourceQuery.or(`title.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }

      const { data: resources, error: resourceError } = await resourceQuery;

      // Combine and normalize results
      const workspaces: Workspace[] = [];

      // Add cached venues
      if (cachedVenues && !cacheError) {
        cachedVenues.forEach(venue => {
          // Double-check hotel exclusion
          if (!isHotelVenue(venue.name, venue.address || '')) {
            workspaces.push({
              id: venue.id,
              name: venue.name,
              address: venue.address || '',
              city: venue.city,
              country: venue.country,
              latitude: Number(venue.latitude) || 0,
              longitude: Number(venue.longitude) || 0,
              workspace_types: (venue.workspace_types as WorkspaceType[]) || ['coworking'],
              amenities: venue.amenities || [],
              hourly_rate_min: venue.hourly_rate_min ? Number(venue.hourly_rate_min) : null,
              hourly_rate_max: venue.hourly_rate_max ? Number(venue.hourly_rate_max) : null,
              daily_rate_min: venue.daily_rate_min ? Number(venue.daily_rate_min) : null,
              daily_rate_max: venue.daily_rate_max ? Number(venue.daily_rate_max) : null,
              rating: venue.rating ? Number(venue.rating) : null,
              image_url: venue.image_url,
              provider: 'liquidspace',
              external_venue_id: venue.external_venue_id || undefined,
            });
          }
        });
      }

      // Add resources as workspaces
      if (resources && !resourceError) {
        resources.forEach(resource => {
          // Skip if already in cache (by checking coordinates proximity)
          const isDuplicate = workspaces.some(w => 
            Math.abs(w.latitude - (resource.latitude || 0)) < 0.0001 &&
            Math.abs(w.longitude - (resource.longitude || 0)) < 0.0001
          );

          if (!isDuplicate && !isHotelVenue(resource.title, resource.city || '')) {
            workspaces.push({
              id: resource.id,
              name: resource.title,
              address: resource.city || '',
              city: resource.city || '',
              country: resource.country || '',
              latitude: resource.latitude || 0,
              longitude: resource.longitude || 0,
              workspace_types: resource.resource_type === 'coworking' ? ['coworking'] : 
                              resource.resource_type === 'office' ? ['private_office'] : ['event_space'],
              amenities: ['wifi', 'coffee'], // Default amenities for resources
              hourly_rate_min: null,
              hourly_rate_max: null,
              daily_rate_min: null,
              daily_rate_max: null,
              rating: null,
              image_url: resource.logo_url,
              provider: 'internal',
            });
          }
        });
      }

      // Apply workspace type filter
      if (filters.workspaceType && filters.workspaceType.length > 0) {
        return workspaces.filter(w => 
          w.workspace_types.some(type => filters.workspaceType!.includes(type))
        );
      }

      // Apply amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        return workspaces.filter(w =>
          filters.amenities!.every(amenity => w.amenities.includes(amenity))
        );
      }

      return workspaces;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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
