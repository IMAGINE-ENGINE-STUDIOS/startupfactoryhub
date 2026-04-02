import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CalendarSettings {
  id: string;
  user_id: string;
  booking_slug: string;
  default_duration: number;
  buffer_minutes: number;
  timezone: string;
  google_calendar_connected: boolean;
  microsoft_calendar_connected: boolean;
  is_booking_enabled: boolean;
}

export const useCalendarSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) { setSettings(null); setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_booking_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error fetching calendar settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, [user]);

  const createOrUpdateSettings = async (updates: Partial<CalendarSettings> & { booking_slug?: string }) => {
    if (!user) return;
    try {
      if (settings) {
        const { error } = await supabase
          .from('calendar_booking_settings')
          .update(updates)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const slug = updates.booking_slug || user.email?.split('@')[0] || user.id.slice(0, 8);
        const { error } = await supabase
          .from('calendar_booking_settings')
          .insert({ user_id: user.id, booking_slug: slug, ...updates });
        if (error) throw error;
      }
      toast({ title: 'Settings saved' });
      await fetchSettings();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return { settings, loading, createOrUpdateSettings, refetch: fetchSettings };
};
