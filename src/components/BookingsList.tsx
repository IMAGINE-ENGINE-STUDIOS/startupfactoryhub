import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCalendarBookings, type CalendarBooking } from '@/hooks/useCalendarBookings';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isTomorrow } from 'date-fns';
import { Calendar, Video, MapPin, CheckCircle, XCircle, Clock, Inbox, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'requests' | 'scheduled';
type Category = 'all' | 'pitch' | 'mentorship';

interface Props {
  /** 'requests' = only new/pending incoming requests. 'scheduled' = accepted/booked meetings. */
  variant?: Variant;
  /** Route bookings into the pitch lane or the mentorship lane. */
  category?: Category;
  title?: string;
  emptyLabel?: string;
}

const isPitch = (b: CalendarBooking) => {
  const text = `${b.topic || ''} ${b.notes || ''}`.toLowerCase();
  return /pitch|invest|funding|raise|vc|due diligence/.test(text);
};

const dateLabel = (d: Date) => {
  if (isToday(d)) return `Today · ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy · h:mm a');
};

export default function BookingsList({
  variant = 'requests',
  category = 'all',
  title,
  emptyLabel,
}: Props) {
  const { user } = useAuth();
  const { bookings, loading, updateBookingStatus } = useCalendarBookings();

  if (loading) return null;

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const scheduled = new Date(b.scheduled_at);
    const isHost = b.host_id === user?.id;
    if (category !== 'all') {
      const cat: Category = isPitch(b) ? 'pitch' : 'mentorship';
      if (cat !== category) return false;
    }
    if (variant === 'requests') {
      return isHost && b.status === 'pending' && scheduled >= now;
    }
    return b.status === 'confirmed' && scheduled >= now;
  });

  if (!filtered.length) {
    if (variant === 'requests') return null;
    if (!emptyLabel) return null;
    return (
      <div className="rounded-2xl border border-border/40 bg-background/30 backdrop-blur-xl p-6 text-center">
        <Inbox className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  const heading =
    title || (variant === 'requests' ? 'New Meeting Requests' : 'Booked Meetings');

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-xl',
        variant === 'requests'
          ? 'border-primary/30 bg-primary/[0.04]'
          : 'border-border/40 bg-background/30'
      )}
    >
      {variant === 'requests' && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      )}

      <div className="flex items-center justify-between gap-3 px-4 md:px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
              variant === 'requests' ? 'bg-primary/15' : 'bg-muted/40'
            )}
          >
            {variant === 'requests' ? (
              <Sparkles className="h-4 w-4 text-primary" />
            ) : (
              <Calendar className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight truncate">{heading}</h3>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {variant === 'requests'
                ? 'Awaiting your response'
                : 'Confirmed and upcoming'}
            </p>
          </div>
        </div>
        <Badge variant={variant === 'requests' ? 'default' : 'secondary'} className="shrink-0">
          {filtered.length}
        </Badge>
      </div>

      <ScrollArea className="max-h-[380px]">
        <div className="px-3 md:px-4 pb-4 space-y-2">
          {filtered.map((b) => {
            const isHost = b.host_id === user?.id;
            const scheduled = new Date(b.scheduled_at);
            return (
              <div
                key={b.id}
                className="group rounded-xl border border-border/40 bg-background/40 hover:border-primary/40 transition-colors p-3 md:p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {b.topic || 'Meeting'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      with {isHost ? b.booker_name : 'You'}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-primary shrink-0">
                    {dateLabel(scheduled)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {b.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    {b.meeting_type === 'virtual' ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {b.meeting_type === 'virtual' ? 'Video Call' : b.location || 'In Person'}
                  </span>
                </div>

                {variant === 'requests' && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => updateBookingStatus(b.id, 'confirmed')}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1"
                      onClick={() => updateBookingStatus(b.id, 'cancelled')}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Decline
                    </Button>
                  </div>
                )}

                {variant === 'scheduled' &&
                  b.meeting_type === 'virtual' &&
                  b.meeting_link && (
                    <Button size="sm" variant="outline" className="h-7 text-xs mt-3" asChild>
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
    </div>
  );
}
