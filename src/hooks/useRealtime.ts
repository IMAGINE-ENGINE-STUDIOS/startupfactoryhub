import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeProps {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string;
}

export const useRealtime = ({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter,
}: UseRealtimeProps) => {
  useEffect(() => {
    const channel: RealtimeChannel = supabase.channel(`${table}-changes`);

    if (onInsert) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter,
        },
        (payload) => onInsert(payload.new)
      );
    }

    if (onUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter,
        },
        (payload) => onUpdate(payload.new)
      );
    }

    if (onDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter,
        },
        (payload) => onDelete(payload.old)
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
};
