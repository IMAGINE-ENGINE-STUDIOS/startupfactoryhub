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
          is_virtual
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_virtual', false)
        .gte('end_date', now) // Event hasn't ended yet
        .lte('start_date', thirtyDaysFromNow.toISOString()) // Event starts within 30 days
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Fetch organizer profiles and attendee counts
      const eventsWithDetails = await Promise.all(
        (events || []).map(async (event) => {
          // Get organizer profile
          const { data: organizer } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', event.organizer_id)
            .single();

          // Get attendee count
          const { count } = await supabase
            .from('event_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('status', 'going');

          return {
            ...event,
            organizer: organizer || undefined,
            attendee_count: count || 0,
          } as MapEvent;
        })
      );

      return eventsWithDetails;
    },
    refetchInterval: 60000, // Refresh every minute to check for ended events
  });
};
