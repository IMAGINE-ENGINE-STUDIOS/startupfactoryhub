import { useState, useEffect } from 'react';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import DashboardNavigation from '@/components/DashboardNavigation';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';

export default function Events() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const handleItemClick = (item: any) => {
    if (item.type === 'event') {
      setSelectedEvent(item);
      setShowEventDetails(true);
    }
  };

  const handleEventUpdated = () => {
    setShowEventDetails(false);
    fetchAllEvents();
  };

  const fetchAllEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:profiles!events_organizer_id_fkey(full_name, avatar_url)
      `)
      .order('start_date', { ascending: false })
      .limit(12);

    if (data && !error) {
      setAllEvents(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pt-16 sm:pt-24 pb-20 lg:pb-6">
        <UnifiedCalendar 
          showCreateButton={true}
          onCreateEvent={() => setShowCreateDialog(true)}
          onItemClick={handleItemClick}
          filterTypes={['event', 'session', 'availability']}
        />
      </div>

      {allEvents.length > 0 && (
        <div className="container mx-auto px-2 sm:px-4 pb-8">
          <Card className="tech-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                All Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventDetails(true);
                    }}
                  >
                    {event.banner_url && (
                      <div className="h-32 overflow-hidden rounded-t-lg">
                        <img 
                          src={event.banner_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(event.start_date), 'PPP')}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <Badge variant="secondary">{event.attendees_count || 0} attending</Badge>
                        </div>
                      </div>
                      {event.organizer && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={event.organizer.avatar_url} />
                            <AvatarFallback>{event.organizer.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{event.organizer.full_name}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={() => {
          setShowCreateDialog(false);
          fetchAllEvents();
        }}
      />

      {selectedEvent && (
        <EventDetailsDialog
          open={showEventDetails}
          onOpenChange={setShowEventDetails}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
}
