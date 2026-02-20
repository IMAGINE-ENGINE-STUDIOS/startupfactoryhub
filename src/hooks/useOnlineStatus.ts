import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useOnlineStatus = (user?: User | null) => {
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

    // Set user as offline — only called on actual page unload (browser close / explicit logout)
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

    // Track user activity across all tabs/windows
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Set online on mount
    setOnline();

    // Heartbeat: refresh last_seen every 2 minutes as long as the session is alive.
    // Switching browser tabs does NOT count as inactivity — the interval keeps running.
    intervalRef.current = setInterval(async () => {
      // Always keep the heartbeat going; do NOT check tab visibility.
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    }, 2 * 60 * 1000); // Every 2 minutes

    // Track activity for informational purposes only
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Only set offline when the browser tab/window is actually closed or the user navigates away entirely.
    // Tab switching fires visibilitychange but NOT beforeunload, so we intentionally ignore it.
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on unload
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_user_online_status`,
        JSON.stringify({ p_user_id: user.id, p_is_online: false })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: set offline only when the React session ends (logout / component unmount due to auth change)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only mark offline if user is truly logging out (user object disappears)
      setOffline();
    };
  }, [user]);
};

