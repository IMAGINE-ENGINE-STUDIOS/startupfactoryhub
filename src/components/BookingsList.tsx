import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, Video, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function BookingsList() {
  const { user } = useAuth();
  const { bookings, loading, updateBookingStatus } = useCalendarBookings();

  if (loading) return null;
  if (!bookings.length) return null;

  return (
    <Card className="glass-morphism border-border/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Bookings ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {bookings.map(b => {
              const isHost = b.host_id === user?.id;
              const isPast = new Date(b.scheduled_at) < new Date();
              return (
                <div key={b.id} className="p-3 rounded-lg border border-border/30 bg-background/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{b.topic || 'Meeting'}</p>
                      <p className="text-xs text-muted-foreground">
                        with {isHost ? b.booker_name : 'You'}
                      </p>
                    </div>
                    <Badge variant={
                      b.status === 'confirmed' ? 'default' :
                      b.status === 'cancelled' ? 'destructive' : 'secondary'
                    } className="text-xs shrink-0">
                      {b.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(b.scheduled_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    <span>{b.duration_minutes}min</span>
                    <span className="flex items-center gap-1">
                      {b.meeting_type === 'virtual' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {b.meeting_type === 'virtual' ? 'Video Call' : b.location || 'In Person'}
                    </span>
                  </div>
                  {isHost && b.status === 'pending' && !isPast && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => updateBookingStatus(b.id, 'confirmed')}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateBookingStatus(b.id, 'cancelled')}>
                        <XCircle className="h-3 w-3 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                  {b.meeting_type === 'virtual' && b.meeting_link && b.status === 'confirmed' && !isPast && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                      <a href={b.meeting_link} target="_blank" rel="noopener noreferrer">
                        <Video className="h-3 w-3 mr-1" /> Join Video Call
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
