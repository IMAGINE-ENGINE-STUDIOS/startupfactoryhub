import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Activity {
  id: string;
  session_id: string;
  user_id: string;
  action_type: string;
  action_data: any;
  page_number: number | null;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useActivity = (sessionId: string | null) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      
      const { data: activitiesData, error } = await supabase
        .from('pdf_activities')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(activitiesData?.map(a => a.user_id) || [])];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]));

      const activitiesWithUsers = (activitiesData || []).map(activity => ({
        ...activity,
        user: usersMap.get(activity.user_id),
      }));

      setActivities(activitiesWithUsers);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity feed');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Log activity
  const logActivity = useCallback(async (
    actionType: string,
    actionData: any,
    pageNumber?: number
  ) => {
    if (!sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('pdf_activities')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          action_type: actionType,
          action_data: actionData,
          page_number: pageNumber || null,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error logging activity:', error);
      // Don't show toast for activity logging errors
    }
  }, [sessionId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    fetchActivities();

    const activitiesChannel = supabase
      .channel(`pdf-activities-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pdf_activities',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    setChannel(activitiesChannel);

    return () => {
      activitiesChannel.unsubscribe();
    };
  }, [sessionId, fetchActivities]);

  return {
    activities,
    isLoading,
    logActivity,
    refetch: fetchActivities,
  };
};
