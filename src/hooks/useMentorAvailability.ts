import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export const useMentorAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvailability = async () => {
    if (!user) {
      setAvailability([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      setAvailability(data || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch availability'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const addAvailability = async (slot: Omit<AvailabilitySlot, 'id'>) => {
    if (!user) return { error: new Error('No user') };

    try {
      const { data, error } = await supabase
        .from('mentor_availability')
        .insert({
          mentor_id: user.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        })
        .select()
        .single();

      if (error) throw error;

      fetchAvailability();
      return { data, error: null };
    } catch (err) {
      console.error('Error adding availability:', err);
      return { data: null, error: err as Error };
    }
  };

  const updateAvailability = async (id: string, updates: Partial<AvailabilitySlot>) => {
    try {
      const { data, error } = await supabase
        .from('mentor_availability')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      fetchAvailability();
      return { data, error: null };
    } catch (err) {
      console.error('Error updating availability:', err);
      return { data: null, error: err as Error };
    }
  };

  const deleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mentor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchAvailability();
      return { error: null };
    } catch (err) {
      console.error('Error deleting availability:', err);
      return { error: err as Error };
    }
  };

  return {
    availability,
    loading,
    error,
    addAvailability,
    updateAvailability,
    deleteAvailability,
    refetch: fetchAvailability,
  };
};
