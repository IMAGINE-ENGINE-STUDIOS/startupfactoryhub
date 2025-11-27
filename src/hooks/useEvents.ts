import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  organizer_id: string;
  max_attendees: number | null;
  profiles?: {
    full_name: string;
  };
  attendees?: number;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: eventsData, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (fetchError) throw fetchError;

      // Get unique organizer IDs
      const organizerIds = [...new Set(eventsData?.map(event => event.organizer_id) || [])];

      // Fetch organizer profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', organizerIds);

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Get attendee counts
      const eventIds = eventsData?.map(e => e.id) || [];
      const { data: attendeesData } = await supabase
        .from('event_attendees')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'going');

      const attendeesCounts = (attendeesData || []).reduce((acc, att) => {
        acc[att.event_id] = (acc[att.event_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const formattedEvents = (eventsData || []).map(event => ({
        ...event,
        profiles: profilesMap[event.organizer_id] || null,
        attendees: attendeesCounts[event.id] || 0
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Real-time subscription for events and attendees
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        console.log('Event change detected:', payload);
        fetchEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, (payload) => {
        console.log('Event attendee change detected:', payload);
        fetchEvents(); // Refetch to update attendee counts
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const upcomingEvents = events.filter(
    event => new Date(event.start_date) >= new Date()
  );

  return {
    events,
    upcomingEvents,
    loading,
    error,
    refetch: fetchEvents,
  };
};
