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
      upcoming: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/30 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
      ongoing: 'bg-[#2EF8A0]/15 text-[#2EF8A0] border-[#2EF8A0]/30 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
      past: 'bg-white/[0.06] text-white/50 border-white/15 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider'
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
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{events.length}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total Events</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 text-[#2EF8A0] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{upcomingCount}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Video className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{virtualCount}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Virtual Events</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{totalAttendees}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total RSVPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchEvents} className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
            <Calendar className="h-5 w-5" />
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Event</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Date</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Location</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Type</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Status</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">RSVPs</TableHead>
                  <TableHead className="text-right font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Actions</TableHead>
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
                          <Badge className="bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/30 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">
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
                            <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="text-[#FF3D6E]">
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