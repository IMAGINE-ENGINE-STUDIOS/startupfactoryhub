// DEPRECATED: This hook was for the old operation-based approach
// With Fabric.js, we handle collaboration differently
// Keeping for backward compatibility but not used in new editor

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFCollaborationCursor } from '@/types/pdf-editor';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UsePDFRealtimeReturn {
  collaborators: PDFCollaborationCursor[];
  updateCursor: (x: number, y: number, pageNumber: number) => Promise<void>;
  isConnected: boolean;
}

export const usePDFRealtime = (
  sessionId: string | null,
  currentPage: number
): UsePDFRealtimeReturn => {
  const [collaborators, setCollaborators] = useState<PDFCollaborationCursor[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random color for this user
  const userColor = useRef(`hsl(${Math.random() * 360}, 70%, 60%)`).current;
  const userName = useRef(`User-${Math.random().toString(36).substring(7)}`).current;

  // Update cursor position (throttled)
  const updateCursor = useCallback(
    async (x: number, y: number, pageNumber: number) => {
      if (!sessionId) return;

      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }

      cursorTimerRef.current = setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('pdf_collaboration_cursors')
            .upsert({
              session_id: sessionId,
              user_id: user.id,
              user_name: userName,
              user_color: userColor,
              position: { x, y },
              page_number: pageNumber,
              last_active: new Date().toISOString(),
            });

          if (error) {
            console.error('Error updating cursor:', error);
          }
        } catch (err) {
          console.error('Error updating cursor position:', err);
        }
      }, 100);
    },
    [sessionId, userName, userColor]
  );

  useEffect(() => {
    if (!sessionId) return;

    const setupChannel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase.channel(`pdf-session-${sessionId}`);
      channelRef.current = channel;

      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pdf_collaboration_cursors',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              setCollaborators((prev) =>
                prev.filter((c) => c.id !== (payload.old as any).id)
              );
            } else {
              const cursor = (payload.new || payload.old) as PDFCollaborationCursor;
              if (cursor.user_id === user.id) return;

              setCollaborators((prev) => {
                const filtered = prev.filter((c) => c.id !== cursor.id);
                return [...filtered, cursor];
              });
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupChannel();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      
      const cleanup = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('pdf_collaboration_cursors')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', user.id);
      };

      cleanup();
    };
  }, [sessionId]);

  return {
    collaborators,
    updateCursor,
    isConnected,
  };
};
