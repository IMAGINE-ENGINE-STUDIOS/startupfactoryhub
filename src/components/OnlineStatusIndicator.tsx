import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineStatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineStatusIndicator = ({ 
  userId, 
  size = 'md',
  className = ''
}: OnlineStatusIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Fetch initial online status
    const fetchOnlineStatus = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_online')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setIsOnline(data.is_online);
      }
    };

    fetchOnlineStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`online-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new.is_online !== undefined) {
            setIsOnline(payload.new.is_online);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <span 
      className={`inline-block ${sizeClasses[size]} rounded-full bg-green-500 border-2 border-background ${className}`}
      title="Online"
    />
  );
};
