import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOnlineStatus = () => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;

    // Set user as online when component mounts
    const setOnline = async () => {
      try {
        await supabase.rpc('update_user_online_status', {
          p_user_id: user.id,
          p_is_online: true
        });
      } catch (error) {
        console.error('Error setting online status:', error);
      }
    };

    // Set user as offline
    const setOffline = async () => {
      try {
        await supabase.rpc('update_user_online_status', {
          p_user_id: user.id,
          p_is_online: false
        });
      } catch (error) {
        console.error('Error setting offline status:', error);
      }
    };

    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Set online on mount
    setOnline();

    // Update last_seen every 2 minutes while active
    intervalRef.current = setInterval(async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // If user has been inactive for more than 3 minutes, set as offline
      if (timeSinceActivity > 3 * 60 * 1000) {
        await setOffline();
      } else {
        // Update online status and last_seen
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Set offline on page unload
    const handleBeforeUnload = () => {
      setOffline();
    };

    // Use visibility API for better detection of page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
    };
  }, [user]);
};
