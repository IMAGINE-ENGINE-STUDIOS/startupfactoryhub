import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CalendarBooking {
  id: string;
  host_id: string;
  booker_id: string | null;
  booker_name: string;
  booker_email: string;
  scheduled_at: string;
  duration_minutes: number;
  topic: string | null;
  status: string;
  meeting_type: string;
  meeting_link: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  created_at: string;
}

export const useCalendarBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) { setBookings([]); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_bookings')
        .select('*')
        .or(`host_id.eq.${user.id},booker_id.eq.${user.id}`)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [user]);

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('calendar_bookings')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast({ title: `Booking ${status}` });

      // Send confirmation email when host confirms
      if (status === 'confirmed') {
        const booking = bookings.find(b => b.id === id);
        if (booking) {
          try {
            const scheduledDate = new Date(booking.scheduled_at);
            await supabase.functions.invoke('send-booking-email', {
              body: {
                to: booking.booker_email,
                bookerName: booking.booker_name,
                hostName: user?.user_metadata?.full_name || 'Host',
                date: scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                time: scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                duration: booking.duration_minutes,
                meetingType: booking.meeting_type,
                meetingLink: booking.meeting_link || undefined,
                location: booking.location || undefined,
                topic: booking.topic || undefined,
                type: 'booking_confirmed',
              },
            });
          } catch (emailErr) {
            console.warn('Could not send confirmation email:', emailErr);
          }
        }
      }

      await fetchBookings();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return { bookings, loading, updateBookingStatus, refetch: fetchBookings };
};
