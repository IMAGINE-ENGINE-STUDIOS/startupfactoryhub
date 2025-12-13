import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, isFuture, isPast } from 'date-fns';
import { 
  Search, 
  Eye, 
  Trash2,
  Calendar,
  RefreshCw,
  MoreVertical,
  MapPin,
  Users,
  Video,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  is_virtual: boolean | null;
  is_public: boolean | null;
  max_attendees: number | null;
  organizer_id: string;
  created_at: string;
}

interface EventAttendee {
  event_id: string;
  count: number;
}

const EventsManagement = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch attendee counts
      const { data: attendees, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('event_id');

      if (attendeesError) throw attendeesError;

      // Count attendees per event
      const counts = new Map<string, number>();
      attendees?.forEach(a => {
        counts.set(a.event_id, (counts.get(a.event_id) || 0) + 1);
      });

      setEvents(eventsData || []);
      setAttendeeCounts(counts);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Deleted",
        description: "Event has been deleted"
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const getEventStatus = (event: Event) => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const now = new Date();

    if (isPast(end)) return 'past';
    if (isFuture(start)) return 'upcoming';
    return 'ongoing';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ongoing: 'bg-green-500/20 text-green-400 border-green-500/30',
      past: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status] || '';
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = !searchQuery || 
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getEventStatus(e);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upcomingCount = events.filter(e => getEventStatus(e) === 'upcoming').length;
  const virtualCount = events.filter(e => e.is_virtual).length;
  const totalAttendees = Array.from(attendeeCounts.values()).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold">{upcomingCount}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Video className="h-5 w-5 text-purple-400 mb-2" />
            <p className="text-2xl font-bold">{virtualCount}</p>
            <p className="text-xs text-muted-foreground">Virtual Events</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-cyan-400 mb-2" />
            <p className="text-2xl font-bold">{totalAttendees}</p>
            <p className="text-xs text-muted-foreground">Total RSVPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 tech-card border-0"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] tech-card border-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchEvents} className="tech-card border-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>RSVPs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p>{format(new Date(event.start_date), 'MMM dd, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(event.start_date), 'HH:mm')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{event.location || 'TBD'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.is_virtual ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Video className="h-3 w-3 mr-1" />
                            Virtual
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            Physical
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(status)}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{attendeeCounts.get(event.id) || 0}</span>
                          {event.max_attendees && (
                            <span className="text-muted-foreground">/{event.max_attendees}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              Feature Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsManagement;