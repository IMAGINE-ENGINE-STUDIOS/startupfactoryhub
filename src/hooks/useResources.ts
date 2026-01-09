import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ResourceType = 
  | 'office' 
  | 'lab' 
  | 'venue' 
  | 'perk' 
  | 'chamber_of_commerce' 
  | 'technology_transfer' 
  | 'community' 
  | 'government_grant' 
  | 'accelerator_incubator' 
  | 'entrepreneur_center' 
  | 'university' 
  | 'coworking' 
  | 'investor_network'
  | 'human_capital'
  | 'event'
  | 'other';

export type LocationType = 'physical' | 'online' | 'hybrid';

export type JourneyStep = 'idea' | 'research' | 'mvp' | 'validation' | 'launch' | 'growth' | 'all';

export const JOURNEY_STEPS: { value: JourneyStep; label: string }[] = [
  { value: 'idea', label: 'Idea Validation' },
  { value: 'research', label: 'Market Research' },
  { value: 'mvp', label: 'MVP Development' },
  { value: 'validation', label: 'User Validation' },
  { value: 'launch', label: 'Product Launch' },
  { value: 'growth', label: 'Growth & Funding' },
  { value: 'all', label: 'All Stages' },
];

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  location_type: LocationType;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  contact_email: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_official_partner: boolean | null;
  journey_steps: JourneyStep[] | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceFilters {
  type?: ResourceType;
  search?: string;
  journeyStep?: JourneyStep;
  city?: string;
}

export const useResources = (filters?: ResourceFilters) => {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      // Only select needed columns for map display to reduce payload
      let query = supabase
        .from('resources')
        .select('id, title, description, resource_type, location_type, address, city, country, latitude, longitude, website_url, contact_email, logo_url, is_verified, is_official_partner, journey_steps, created_at')
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('resource_type', filters.type);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,city.ilike.%${filters.search}%,country.ilike.%${filters.search}%`);
      }

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter by journey step client-side since it's an array
      let filteredData = data as Resource[];
      if (filters?.journeyStep) {
        filteredData = filteredData.filter(resource => {
          const steps = resource.journey_steps || [];
          return steps.includes(filters.journeyStep!) || steps.includes('all');
        });
      }

      return filteredData;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: Partial<Resource>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const resourceData: any = {
        ...resource,
        author_id: user.id,
        is_verified: false,
      };

      const { data, error } = await supabase
        .from('resources')
        .insert(resourceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource submitted! It will appear after verification.');
    },
    onError: (error) => {
      toast.error('Failed to submit resource: ' + error.message);
    },
  });
};

export const useBookmarkResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('resource_bookmarks')
        .insert({ user_id: user.id, resource_id: resourceId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Resource bookmarked!');
    },
    onError: (error) => {
      toast.error('Failed to bookmark: ' + error.message);
    },
  });
};

export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('resource_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_id', resourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed');
    },
  });
};

export const useUserBookmarks = () => {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('resource_bookmarks')
        .select('resource_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(b => b.resource_id) || [];
    },
  });
};
