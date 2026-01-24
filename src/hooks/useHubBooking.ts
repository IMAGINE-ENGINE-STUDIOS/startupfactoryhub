import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface BookingDetails {
  venueId: string;
  venueName: string;
  workspaceType: string;
  fromDatetime: Date;
  toDatetime: Date;
  price?: number;
  currency?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  provider: string;
  provider_booking_id: string | null;
  venue_id: string;
  venue_name: string;
  workspace_type: string;
  from_datetime: string;
  to_datetime: string;
  price: number | null;
  currency: string | null;
  status: string;
  payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
}

export const useHubBooking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createBooking = useMutation({
    mutationFn: async (details: BookingDetails) => {
      if (!user) throw new Error('Must be logged in to book');

      const { data, error } = await supabase
        .from('hub_bookings')
        .insert({
          user_id: user.id,
          provider: 'internal',
          venue_id: details.venueId,
          venue_name: details.venueName,
          workspace_type: details.workspaceType,
          from_datetime: details.fromDatetime.toISOString(),
          to_datetime: details.toDatetime.toISOString(),
          price: details.price,
          currency: details.currency || 'USD',
          status: 'pending',
          notes: details.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast({
        title: 'Booking created',
        description: 'Your workspace booking has been submitted',
      });
    },
    onError: (error) => {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('hub_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled',
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createBooking, cancelBooking };
};

export const useUserBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async (): Promise<Booking[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('hub_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('from_datetime', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};
