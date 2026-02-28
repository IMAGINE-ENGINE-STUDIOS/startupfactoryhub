import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Clock, MapPin, Building2, RefreshCw, Users, Monitor, DoorOpen, Crown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

// Status steps in order
const STEPS = ['pending', 'confirmed', 'cancelled'] as const;

const STEP_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pending', icon: '⏳', color: 'text-amber-500' },
  confirmed: { label: 'Active', icon: '✅', color: 'text-emerald-500' },
  needs_action: { label: 'Updating', icon: '⚠️', color: 'text-orange-500' },
  cancelled: { label: 'Cancelled', icon: '❌', color: 'text-red-500' },
};

const TIER_CONFIG: Record<string, { label: string; icon: React.ReactNode; spaceType: string; badgeClass: string }> = {
  community: {
    label: 'Community',
    icon: <Users className="h-3.5 w-3.5" />,
    spaceType: 'Community Space',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  self_paced: {
    label: 'Self-Paced + Desk',
    icon: <Monitor className="h-3.5 w-3.5" />,
    spaceType: 'Desk Access',
    badgeClass: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  global_access: {
    label: 'Global Access + Office',
    icon: <DoorOpen className="h-3.5 w-3.5" />,
    spaceType: 'Private Office',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  corporate: {
    label: 'Corporate',
    icon: <Crown className="h-3.5 w-3.5" />,
    spaceType: 'Premium Office',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
};

// Step line component
function BookingStepLine({ status }: { status: string }) {
  const steps = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Active' },
    { key: 'needs_action', label: 'Updating' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Determine active index
  const activeIndex = steps.findIndex(s => s.key === status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="flex items-center w-full gap-0 py-3 px-1">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const isCancelledStep = step.key === 'cancelled';

        let dotColor = 'bg-muted-foreground/20';
        let lineColor = 'bg-muted-foreground/15';
        let textColor = 'text-muted-foreground/50';

        if (isActive) {
          dotColor = isCancelledStep ? 'bg-red-500' : step.key === 'needs_action' ? 'bg-orange-500' : 'bg-emerald-500';
          textColor = isCancelledStep ? 'text-red-500' : step.key === 'needs_action' ? 'text-orange-500' : 'text-emerald-500';
        } else if (isPast) {
          dotColor = 'bg-emerald-500/60';
          lineColor = 'bg-emerald-500/40';
          textColor = 'text-emerald-600/60';
        }

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300 shrink-0",
                dotColor,
                isActive && "ring-4 ring-current/10 w-3.5 h-3.5"
              )} />
              <span className={cn("text-[10px] font-medium whitespace-nowrap", textColor)}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "h-[2px] flex-1 mx-1 rounded-full transition-all",
                isPast ? 'bg-emerald-500/40' : 'bg-muted-foreground/15'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const { tier } = useMembershipStatus();
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

  // Real-time sync with admin changes
  useEffect(() => {
    if (!user) return;
    fetchBookings();

    const channel = supabase
      .channel('my-bookings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hub_bookings',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // Current user tier info
  const currentTier = TIER_CONFIG[tier] || TIER_CONFIG.community;

  if (bookings.length === 0) {
    return (
      <div className="space-y-4">
        {/* Current Plan Banner */}
        <Card className="tech-card border-0 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            {currentTier.icon}
            <div>
              <p className="text-sm font-semibold">Your Plan: {currentTier.label}</p>
              <p className="text-xs text-muted-foreground">Entitled to: <span className="font-medium text-foreground">{currentTier.spaceType}</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No bookings yet</h3>
            <p className="text-sm text-muted-foreground">
              Book a workspace from the Resources tab to see your bookings here.
            </p>
          </CardContent>
        </Card>
      </div>
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

      {/* Current Plan Banner */}
      <Card className="tech-card border-0 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4 flex items-center gap-3">
          {currentTier.icon}
          <div>
            <p className="text-sm font-semibold">Your Plan: {currentTier.label}</p>
            <p className="text-xs text-muted-foreground">Entitled to: <span className="font-medium text-foreground">{currentTier.spaceType}</span></p>
          </div>
        </CardContent>
      </Card>

      {bookings.map(booking => {
        const bookingTier = TIER_CONFIG[booking.subscription_tier] || TIER_CONFIG.community;
        return (
          <Card key={booking.id} className="tech-card border-0">
            <CardContent className="p-4 sm:p-5 space-y-1">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
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

                {/* Tier badge */}
                <Badge className={cn("border text-xs shrink-0 flex items-center gap-1", bookingTier.badgeClass)}>
                  {bookingTier.icon}
                  {bookingTier.spaceType}
                </Badge>
              </div>

              {/* Step progress line */}
              <BookingStepLine status={booking.status} />

              {/* Date & time info */}
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
