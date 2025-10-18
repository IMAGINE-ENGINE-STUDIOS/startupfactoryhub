import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Video, User } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';
import { useMentorAvailability } from '@/hooks/useMentorAvailability';

type CalendarItemType = 'event' | 'session' | 'availability' | 'pitch';

interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  location?: string;
  banner_url?: string;
  organizer?: string;
  attendees?: number;
  max_attendees?: number;
  meeting_link?: string;
  status?: string;
  mentor_name?: string;
  mentee_name?: string;
  duration_minutes?: number;
}

interface UnifiedCalendarProps {
  showCreateButton?: boolean;
  onCreateEvent?: () => void;
  onItemClick?: (item: CalendarItem) => void;
  filterTypes?: CalendarItemType[];
}

export default function UnifiedCalendar({ 
  showCreateButton = true, 
  onCreateEvent,
  onItemClick,
  filterTypes = ['event', 'session', 'availability', 'pitch']
}: UnifiedCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const { user } = useAuth();
  const { sessions } = useMentoringSessions();
  const { availability } = useMentorAvailability();

  useEffect(() => {
    fetchEvents();
    fetchPitchMeetings();

    // Real-time subscription for events
    const channel = supabase
      .channel('unified-calendar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_meetings' }, () => {
        fetchPitchMeetings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
  };

  const fetchPitchMeetings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pitch_meetings')
      .select(`
        *,
        company:companies(name, logo_url),
        startup:profiles!pitch_meetings_startup_id_fkey(full_name),
        investor:profiles!pitch_meetings_investor_id_fkey(full_name)
      `)
      .or(`startup_id.eq.${user.id},investor_id.eq.${user.id}`)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching pitch meetings:', error);
      return;
    }

    setPitchMeetings(data || []);
  };

  // Combine all calendar items
  const getAllItems = (): CalendarItem[] => {
    const items: CalendarItem[] = [];

    // Add community events
    if (filterTypes.includes('event')) {
      events.forEach(event => {
        items.push({
          id: event.id,
          type: 'event',
          title: event.title,
          description: event.description,
          start_date: parseISO(event.start_date),
          end_date: parseISO(event.end_date),
          location: event.location,
          banner_url: event.banner_url,
          organizer: event.profiles?.full_name,
          attendees: event.attendees,
          max_attendees: event.max_attendees,
        });
      });
    }

    // Add mentoring sessions
    if (filterTypes.includes('session')) {
      sessions.forEach(session => {
        items.push({
          id: session.id,
          type: 'session',
          title: session.topic || 'Mentoring Session',
          description: session.description,
          start_date: new Date(session.scheduled_at),
          end_date: new Date(new Date(session.scheduled_at).getTime() + session.duration_minutes * 60000),
          meeting_link: session.meeting_link,
          status: session.status,
          mentor_name: session.mentor_profile?.full_name,
          mentee_name: session.mentee_profile?.full_name,
          duration_minutes: session.duration_minutes,
        });
      });
    }

    // Add availability slots (convert to calendar items for current week)
    if (filterTypes.includes('availability') && user) {
      const today = new Date();
      const currentDay = today.getDay();
      
      availability.forEach(slot => {
        // Calculate dates for the next occurrence of this day
        const daysUntil = (slot.day_of_week - currentDay + 7) % 7;
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + daysUntil);
        
        const [startHour, startMin] = slot.start_time.split(':').map(Number);
        const [endHour, endMin] = slot.end_time.split(':').map(Number);
        
        const startDateTime = new Date(slotDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(slotDate);
        endDateTime.setHours(endHour, endMin, 0, 0);
        
        items.push({
          id: slot.id,
          type: 'availability',
          title: 'Available',
          start_date: startDateTime,
          end_date: endDateTime,
        });
      });
    }

    // Add pitch meetings
    if (filterTypes.includes('pitch') && user) {
      pitchMeetings.forEach(meeting => {
        const isStartup = meeting.startup_id === user.id;
        items.push({
          id: meeting.id,
          type: 'pitch',
          title: `Pitch: ${meeting.company?.name || 'Company'}`,
          description: `With ${isStartup ? meeting.investor?.full_name : meeting.startup?.full_name}`,
          start_date: parseISO(meeting.scheduled_date),
          end_date: new Date(parseISO(meeting.scheduled_date).getTime() + meeting.duration_minutes * 60000),
          meeting_link: meeting.meeting_link,
          status: meeting.status,
          duration_minutes: meeting.duration_minutes,
        });
      });
    }

    return items.sort((a, b) => a.start_date.getTime() - b.start_date.getTime());
  };

  const allItems = getAllItems();

  const getItemsForDate = (date: Date) => {
    return allItems.filter(item => {
      return isSameDay(date, item.start_date);
    });
  };

  const getDatesWithItems = () => {
    return allItems.map(item => item.start_date);
  };

  const getItemTypeColor = (type: CalendarItemType) => {
    switch (type) {
      case 'event':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'session':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'availability':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pitch':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getItemTypeIcon = (type: CalendarItemType) => {
    switch (type) {
      case 'event':
        return <CalendarIcon className="h-4 w-4" />;
      case 'session':
        return <Video className="h-4 w-4" />;
      case 'availability':
        return <Clock className="h-4 w-4" />;
      case 'pitch':
        return <Users className="h-4 w-4" />;
    }
  };

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Unified Calendar</h2>
            <p className="text-muted-foreground">Events, sessions, and availability in one place</p>
          </div>
        </div>
        {showCreateButton && user && onCreateEvent && (
          <Button onClick={onCreateEvent} className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className={getItemTypeColor('event')}>
          <CalendarIcon className="h-3 w-3 mr-1" />
          Community Events
        </Badge>
        <Badge variant="outline" className={getItemTypeColor('session')}>
          <Video className="h-3 w-3 mr-1" />
          Mentoring Sessions
        </Badge>
        <Badge variant="outline" className={getItemTypeColor('availability')}>
          <Clock className="h-3 w-3 mr-1" />
          Available Times
        </Badge>
        <Badge variant="outline" className={getItemTypeColor('pitch')}>
          <Users className="h-3 w-3 mr-1" />
          Pitch Meetings
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-2 sm:p-6 overflow-x-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto w-full max-w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-[10px] sm:text-sm",
                row: "flex w-full mt-2",
                cell: "flex-1 text-center text-[10px] sm:text-sm p-0 relative h-9 sm:h-12 md:h-16",
                day: "h-9 w-full sm:h-12 md:h-16 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-[10px] sm:text-sm",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold",
                day_today: "bg-accent text-accent-foreground font-semibold ring-2 ring-primary ring-offset-2",
                caption_label: "text-sm sm:text-base font-semibold",
                nav_button: "h-7 w-7 sm:h-8 sm:w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent transition-all",
              }}
              modifiers={{
                hasItem: getDatesWithItems()
              }}
              modifiersClassNames={{
                hasItem: "relative font-bold text-primary after:content-[''] after:absolute after:bottom-0.5 sm:after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 sm:after:w-1.5 sm:after:h-1.5 after:rounded-full after:bg-primary"
              }}
            />
          </CardContent>
        </Card>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
            {selectedDateItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No items on this day</p>
              </div>
            ) : (
              selectedDateItems.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3 rounded-lg border hover:border-primary cursor-pointer transition-all overflow-hidden"
                  onClick={() => onItemClick?.(item)}
                >
                  {/* Event Banner */}
                  {item.type === 'event' && item.banner_url && (
                    <img
                      src={item.banner_url}
                      alt={item.title}
                      className="w-full h-24 object-cover rounded-lg mb-3 -mt-3 -mx-3"
                      style={{ width: 'calc(100% + 1.5rem)' }}
                    />
                  )}
                  
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <Badge variant="outline" className={`text-xs ${getItemTypeColor(item.type)}`}>
                      {getItemTypeIcon(item.type)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(item.start_date, 'h:mm a')} - {format(item.end_date, 'h:mm a')}
                    </div>
                    
                    {item.type === 'event' && (
                      <>
                        {item.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{item.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {item.attendees} attending
                          {item.max_attendees && ` / ${item.max_attendees}`}
                        </div>
                      </>
                    )}
                    
                    {item.type === 'session' && (
                      <>
                        {item.mentor_name && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            Mentor: {item.mentor_name}
                          </div>
                        )}
                        {item.meeting_link && (
                          <div className="flex items-center gap-2">
                            <Video className="h-3 w-3" />
                            Video call available
                          </div>
                        )}
                        {item.status && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.status}
                          </Badge>
                        )}
                      </>
                    )}

                    {item.type === 'pitch' && (
                      <>
                        {item.description && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {item.description}
                          </div>
                        )}
                        {item.meeting_link && (
                          <div className="flex items-center gap-2">
                            <Video className="h-3 w-3" />
                            Video call available
                          </div>
                        )}
                        {item.status && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.status}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
