import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Video, User, Building, MoreVertical, Pencil, Trash2, Rocket } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditEventDialog } from '@/components/EditEventDialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, isSameDay, parseISO } from 'date-fns';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';
import { useMentorAvailability } from '@/hooks/useMentorAvailability';
import { cn } from '@/lib/utils';
import CreatePitchMeetingDialog from '@/components/CreatePitchMeetingDialog';

type CalendarItemType = 'event' | 'session' | 'availability' | 'pitch' | 'accelerator' | 'booking';

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
  company_name?: string;
}

interface UnifiedCalendarProps {
  showCreateButton?: boolean;
  onCreateEvent?: () => void;
  onItemClick?: (item: CalendarItem) => void;
  filterTypes?: CalendarItemType[];
  userRole: 'advisor' | 'mentor' | 'startup' | 'student' | 'investor' | 'accelerator' | 'admin';
  onCreatePitchClick?: () => void;
  connectedInvestors?: Array<{id: string, name: string}>;
}

export default function UnifiedCalendar({ 
  showCreateButton = true, 
  onCreateEvent,
  onItemClick,
  filterTypes = ['event', 'session', 'availability', 'pitch', 'accelerator'],
  userRole,
  onCreatePitchClick,
  connectedInvestors
}: UnifiedCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [showPitchDialog, setShowPitchDialog] = useState(false);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [acceleratorCohorts, setAcceleratorCohorts] = useState<any[]>([]);
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const { user } = useAuth();
  const { sessions } = useMentoringSessions();
  const { availability } = useMentorAvailability();
  const { toast } = useToast();

  const fetchCalendarBookings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('calendar_bookings')
      .select('*')
      .or(`host_id.eq.${user.id},booker_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: true });
    if (!error) setCalendarBookings(data || []);
  };

  useEffect(() => {
    fetchEvents();
    fetchPitchMeetings();
    fetchAcceleratorCohorts();
    fetchCalendarBookings();
    if (userRole === 'startup') {
      fetchUserCompany();
    }

    const channel = supabase
      .channel('unified-calendar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitch_meetings' }, () => fetchPitchMeetings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_attendees' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accelerator_cohorts' }, () => fetchAcceleratorCohorts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_bookings' }, () => fetchCalendarBookings())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const fetchEvents = async () => {
    // Fetch all events without role-based filtering to match the events carousel
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

    const { data: meetingsData, error } = await supabase
      .from('pitch_meetings')
      .select('*, company:companies(name, logo_url)')
      .or(`startup_id.eq.${user.id},investor_id.eq.${user.id}`)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching pitch meetings:', error);
      return;
    }

    if (!meetingsData || meetingsData.length === 0) {
      setPitchMeetings([]);
      return;
    }

    // Fetch startup and investor profiles separately
    const startupIds = [...new Set(meetingsData.map(m => m.startup_id))];
    const investorIds = [...new Set(meetingsData.map(m => m.investor_id))];
    const allUserIds = [...new Set([...startupIds, ...investorIds])];

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', allUserIds);

    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {} as Record<string, any>);

    // Combine data
    const enrichedMeetings = meetingsData.map(meeting => ({
      ...meeting,
      startup: profilesMap[meeting.startup_id] || null,
      investor: profilesMap[meeting.investor_id] || null,
    }));

    setPitchMeetings(enrichedMeetings);
  };

  const fetchUserCompany = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setUserCompany(data);
  };

  const fetchAcceleratorCohorts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('accelerator_cohorts')
      .select('*, accelerator_profiles(organization_name, logo_url, user_id)')
      .in('status', ['applications_open', 'in_progress'])
      .gte('start_date', today);

    if (error) {
      console.error('Error fetching accelerator cohorts:', error);
      return;
    }
    setAcceleratorCohorts(data || []);
  };

  const handleEditEvent = (item: CalendarItem) => {
    const event = events.find(e => e.id === item.id);
    if (event) {
      setEditingEvent(event);
      setShowEditDialog(true);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setDeleteEventId(eventId);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEventId) return;

    try {
      // Delete associated event_attendees first
      await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', deleteEventId);

      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteEventId)
        .eq('organizer_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Event deleted',
        description: 'The event has been successfully deleted',
      });

      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setDeleteEventId(null);
    }
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
          organizer: event.profiles?.full_name || 'Unknown Organizer',
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

    // Add accelerator cohort dates
    if (filterTypes.includes('accelerator')) {
      acceleratorCohorts.forEach(cohort => {
        if (cohort.start_date) {
          items.push({
            id: `accel-start-${cohort.id}`,
            type: 'accelerator',
            title: `Program Starts: ${cohort.name}`,
            description: cohort.accelerator_profiles?.organization_name,
            start_date: parseISO(cohort.start_date),
            end_date: parseISO(cohort.start_date),
          });
        }
        if (cohort.application_deadline) {
          items.push({
            id: `accel-deadline-${cohort.id}`,
            type: 'accelerator',
            title: `Deadline: ${cohort.name}`,
            description: cohort.accelerator_profiles?.organization_name,
            start_date: parseISO(cohort.application_deadline),
            end_date: parseISO(cohort.application_deadline),
          });
        }
      });
    }

    // Add calendar bookings
    if (filterTypes.includes('booking') && user) {
      calendarBookings.forEach(booking => {
        const isHost = booking.host_id === user.id;
        items.push({
          id: booking.id,
          type: 'booking',
          title: booking.topic || 'Booking',
          description: `with ${isHost ? booking.booker_name : 'You'}`,
          start_date: parseISO(booking.scheduled_at),
          end_date: new Date(parseISO(booking.scheduled_at).getTime() + booking.duration_minutes * 60000),
          meeting_link: booking.meeting_link,
          status: booking.status,
          duration_minutes: booking.duration_minutes,
          location: booking.location,
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

  const upcomingItems = allItems
    .filter(item => item.start_date >= new Date())
    .sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
    .slice(0, 5);

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
      case 'accelerator':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'booking':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
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
      case 'accelerator':
        return <Rocket className="h-4 w-4" />;
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
        <div className="flex gap-2">
          {showCreateButton && user && onCreateEvent && (
            <Button onClick={onCreateEvent} className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
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
        <Badge variant="outline" className={getItemTypeColor('accelerator')}>
          <Rocket className="h-3 w-3 mr-1" />
          Accelerator Programs
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendar */}
        <Card className="tech-card border-0 lg:col-span-2">
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
        <Card className="tech-card border-0">
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
              <div className="space-y-3">
                {selectedDateItems.map(item => {
                  const event = events.find(e => e.id === item.id);
                  const isOrganizer = item.type === 'event' && user?.id === event?.organizer_id;
                  
                  return (
                    <Card
                      key={`${item.type}-${item.id}`}
                      className="tech-card border-0 hover:scale-[1.02] transition-transform overflow-hidden"
                    >
                      <CardContent className="p-4">
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
                        <h3 
                          className="font-semibold text-sm cursor-pointer hover:text-primary flex-1"
                          onClick={() => onItemClick?.(item)}
                        >
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getItemTypeColor(item.type)}`}>
                            {getItemTypeIcon(item.type)}
                          </Badge>
                          {isOrganizer && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEvent(item)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Event
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEvent(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {format(item.start_date, 'h:mm a')} - {format(item.end_date, 'h:mm a')}
                        </div>
                        
                        {item.type === 'event' && (
                          <>
                            {item.organizer && (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span className="line-clamp-1">Organizer: {item.organizer}</span>
                              </div>
                            )}
                            {item.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {item.location.startsWith('http') ? (
                                  <a 
                                    href={item.location} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline line-clamp-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {item.location}
                                  </a>
                                ) : (
                                  <span className="line-clamp-1">{item.location}</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              {item.attendees} attending
                              {item.max_attendees && ` / ${item.max_attendees}`}
                            </div>
                            {item.location?.includes('whereby.com') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onItemClick?.(item);
                                }}
                                className="gap-2 mt-2 w-full"
                              >
                                <Video className="h-3 w-3" />
                                Join Video Call
                              </Button>
                            )}
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Event Dialog */}
      <EditEventDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onEventUpdated={fetchEvents}
        event={editingEvent}
      />

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={deleteEventId !== null} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone. All attendee data will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pitch Meeting Dialog for Startups */}
      {userCompany && (
        <CreatePitchMeetingDialog
          open={showPitchDialog}
          onOpenChange={setShowPitchDialog}
          companyId={userCompany.id}
          companyName={userCompany.name}
        />
      )}
    </div>
  );
}
