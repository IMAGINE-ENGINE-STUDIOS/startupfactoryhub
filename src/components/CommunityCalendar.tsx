import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, MapPin, Users, Clock } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { CreateEventDialog } from './CreateEventDialog';
import { EventDetailsDialog } from './EventDetailsDialog';

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
    role: string;
  };
  attendees?: number;
}

export default function CommunityCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();

    // Real-time subscription for events
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    // Get unique organizer IDs
    const organizerIds = [...new Set(eventsData?.map(event => event.organizer_id) || [])];

    // Fetch organizer profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, role')
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
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getDatesWithEvents = () => {
    return events.map(event => parseISO(event.start_date));
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Community Events</h2>
            <p className="text-muted-foreground">Discover and join upcoming events</p>
          </div>
        </div>
        {user && (
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="w-full max-w-4xl">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border pointer-events-auto scale-125 sm:scale-150 lg:scale-[1.75] origin-center py-8"
                modifiers={{
                  hasEvent: getDatesWithEvents()
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: 'hsl(var(--primary))'
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No events on this day</p>
              </div>
            ) : (
              selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border hover:border-primary cursor-pointer transition-all"
                  onClick={() => handleEventClick(event)}
                >
                  {event.banner_url && (
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className="font-semibold mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.attendees} attending
                    </div>
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {event.profiles?.full_name || 'Anonymous'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events
              .filter(event => new Date(event.start_date) >= new Date())
              .slice(0, 6)
              .map(event => (
                <div
                  key={event.id}
                  className="group cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                    {event.banner_url ? (
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <CalendarIcon className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {event.attendees} attending
                          {event.max_attendees && ` / ${event.max_attendees}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={fetchEvents}
      />

      {selectedEvent && (
        <EventDetailsDialog
          open={showEventDetails}
          onOpenChange={setShowEventDetails}
          event={selectedEvent}
          onEventUpdated={fetchEvents}
        />
      )}
    </div>
  );
}