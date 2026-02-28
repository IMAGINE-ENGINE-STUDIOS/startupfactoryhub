import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Clock, MapPin, Building2, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  needs_action: { label: 'Needs Action', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hub_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-16 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-1">No bookings yet</h3>
          <p className="text-sm text-muted-foreground">
            Book a workspace from the Resources tab to see your bookings here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Workspace Bookings</h3>
        <Button variant="ghost" size="sm" onClick={fetchBookings}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {bookings.map(booking => {
        const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
        return (
          <Card key={booking.id} className="tech-card border-0">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-teal-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground line-clamp-1">{booking.venue_name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{booking.workspace_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pl-[52px]">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(parseISO(booking.from_datetime), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(booking.from_datetime), 'HH:mm')} – {format(parseISO(booking.to_datetime), 'HH:mm')}
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-muted-foreground pl-[52px] line-clamp-2">
                      <span className="font-medium">Notes:</span> {booking.notes}
                    </p>
                  )}

                  {booking.admin_notes && (
                    <p className="text-xs pl-[52px] line-clamp-2 text-orange-600">
                      <span className="font-medium">Admin:</span> {booking.admin_notes}
                    </p>
                  )}
                </div>

                <Badge className={`${statusConfig.className} border shrink-0`}>
                  {statusConfig.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
