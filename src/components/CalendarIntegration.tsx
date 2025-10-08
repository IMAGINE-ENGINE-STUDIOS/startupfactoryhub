import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Users } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'meeting' | 'event' | 'deadline';
  startTime: Date;
  endTime: Date;
  location?: string;
  isVirtual: boolean;
  attendees: number;
}

export default function CalendarIntegration() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Pitch Practice Session',
      type: 'meeting',
      startTime: new Date(2025, 9, 8, 14, 0),
      endTime: new Date(2025, 9, 8, 15, 0),
      isVirtual: true,
      attendees: 5,
    },
    {
      id: '2',
      title: 'Investor Networking Event',
      type: 'event',
      startTime: new Date(2025, 9, 10, 18, 0),
      endTime: new Date(2025, 9, 10, 20, 0),
      location: 'Tech Hub Downtown',
      isVirtual: false,
      attendees: 50,
    },
    {
      id: '3',
      title: 'Application Deadline',
      type: 'deadline',
      startTime: new Date(2025, 9, 15, 23, 59),
      endTime: new Date(2025, 9, 15, 23, 59),
      isVirtual: false,
      attendees: 0,
    },
  ]);

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
      case 'deadline':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

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
