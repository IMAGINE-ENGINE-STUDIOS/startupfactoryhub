import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MapEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  banner_url: string | null;
  max_attendees: number | null;
  organizer_id: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  is_virtual: boolean;
  organizer?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  attendee_count?: number;
}

export const useEventsForMap = () => {
  return useQuery({
    queryKey: ['events-map'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Fetch physical events that are currently active (started but not ended)
      // OR upcoming events (haven't started yet but will within the next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      // OPTIMIZATION: Single joined query instead of N+1 queries
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location,
          start_date,
          end_date,
          banner_url,
          max_attendees,
          organizer_id,
          latitude,
          longitude,
          city,
          country,
          is_virtual,
          profiles!events_organizer_id_fkey(full_name, avatar_url)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_virtual', false)
        .gte('end_date', now) // Event hasn't ended yet
        .lte('start_date', thirtyDaysFromNow.toISOString()) // Event starts within 30 days
        .order('start_date', { ascending: true });

      if (error) throw error;
      if (!events || events.length === 0) return [];

      // OPTIMIZATION: Batch fetch attendee counts in a single query
      const eventIds = events.map(e => e.id);
      const { data: attendeeCounts } = await supabase
        .from('event_attendees')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'going');

      // Count attendees in JavaScript (much faster than N separate COUNT queries)
      const countMap = (attendeeCounts || []).reduce((acc, attendee) => {
        acc[attendee.event_id] = (acc[attendee.event_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Map events with organizer and attendee count
      const eventsWithDetails = events.map((event) => {
        // Handle the joined profiles data - it can be an array or object depending on query
        const profileData = event.profiles;
        const organizer = Array.isArray(profileData) ? profileData[0] : profileData;

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          start_date: event.start_date,
          end_date: event.end_date,
          banner_url: event.banner_url,
          max_attendees: event.max_attendees,
          organizer_id: event.organizer_id,
          latitude: event.latitude,
          longitude: event.longitude,
          city: event.city,
          country: event.country,
          is_virtual: event.is_virtual,
          organizer: organizer ? {
            full_name: organizer.full_name,
            avatar_url: organizer.avatar_url
          } : undefined,
          attendee_count: countMap[event.id] || 0,
        } as MapEvent;
      });

      return eventsWithDetails;
    },
    refetchInterval: 60000, // Refresh every minute to check for ended events
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
