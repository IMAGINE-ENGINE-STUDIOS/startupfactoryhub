import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Users, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'event' | 'mentoring';
  startTime: Date;
  endTime: Date;
  location?: string;
  isVirtual: boolean;
  attendees: number;
  description?: string;
}

export default function CalendarIntegration() {
  const { user } = useAuth();
  const { sessions } = useMentoringSessions();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [user, sessions]);

  const fetchEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch community events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(50);

      if (eventsError) throw eventsError;

      // Convert community events to CalendarEvent format
      const communityEvents: CalendarEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        title: event.title,
        type: 'event' as const,
        startTime: new Date(event.start_date),
        endTime: new Date(event.end_date),
        location: event.location,
        isVirtual: !event.location,
        attendees: 0,
        description: event.description,
      }));

      // Convert mentoring sessions to CalendarEvent format
      const mentoringEvents: CalendarEvent[] = sessions.map(session => ({
        id: session.id,
        title: session.topic || 'Mentoring Session',
        type: 'mentoring' as const,
        startTime: new Date(session.scheduled_at),
        endTime: new Date(new Date(session.scheduled_at).getTime() + session.duration_minutes * 60000),
        isVirtual: true,
        attendees: 2,
        description: session.description,
      }));

      // Combine all events
      setEvents([...communityEvents, ...mentoringEvents]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsByDate = (date: Date) => {
    return events.filter(event => 
      event.startTime.toDateString() === date.toDateString()
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'event':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'mentoring':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  const selectedEvents = selectedDate ? getEventsByDate(selectedDate) : [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h3 className="font-semibold">Calendar</h3>
        </div>
        <Button variant="outline" size="sm">
          Sync Calendar
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasEvent: events.map(e => e.startTime),
            }}
            modifiersClassNames={{
              hasEvent: 'bg-primary/10 font-bold',
            }}
          />
        </div>

        {/* Events List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Select a date'}
          </h4>
          
          {selectedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No events scheduled</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {selectedEvents.map(event => (
                <Card key={event.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h5 className="font-medium">{event.title}</h5>
                      <Badge 
                        variant="outline" 
                        className={`mt-1 ${getEventTypeColor(event.type)}`}
                      >
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                    </div>
                    
                    {event.isVirtual ? (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Virtual Meeting</span>
                      </div>
                    ) : event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.attendees > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Details
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
