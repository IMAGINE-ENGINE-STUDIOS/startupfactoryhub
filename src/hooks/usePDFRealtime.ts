import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PDFOperation, PDFCollaborationCursor } from '@/types/pdf-editor';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UsePDFRealtimeReturn {
  collaborators: PDFCollaborationCursor[];
  remoteOperations: PDFOperation[];
  updateCursor: (x: number, y: number, pageNumber: number) => Promise<void>;
  isConnected: boolean;
}

export const usePDFRealtime = (
  sessionId: string | null,
  userId: string | null
): UsePDFRealtimeReturn => {
  const [collaborators, setCollaborators] = useState<PDFCollaborationCursor[]>([]);
  const [remoteOperations, setRemoteOperations] = useState<PDFOperation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a random color for this user
  const userColor = useRef(`hsl(${Math.random() * 360}, 70%, 60%)`).current;
  const userName = useRef(`User-${Math.random().toString(36).substring(7)}`).current;

  // Update cursor position (throttled)
  const updateCursor = useCallback(
    async (x: number, y: number, pageNumber: number) => {
      if (!sessionId || !userId) return;

      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }

      cursorTimerRef.current = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('pdf_collaboration_cursors')
            .upsert({
              session_id: sessionId,
              user_id: userId,
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
      }, 50); // Throttle to 20 updates per second
    },
    [sessionId, userId, userName, userColor]
  );

  useEffect(() => {
    if (!sessionId || !userId) return;

    console.log('Setting up PDF realtime for session:', sessionId);

    // Create channel for this session
    const channel = supabase.channel(`pdf-session-${sessionId}`);
    channelRef.current = channel;

    // Listen to operation history changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pdf_operation_history',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('New operation from collaborator:', payload);
          const newOp = payload.new as any;
          
          // Only add operations from other users
          if (newOp.user_id !== userId) {
            setRemoteOperations((prev) => [...prev, newOp.operation_data]);
          }
        }
      )
      // Listen to cursor updates
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
            
            // Don't show own cursor
            if (cursor.user_id === userId) return;

            setCollaborators((prev) => {
              const filtered = prev.filter((c) => c.id !== cursor.id);
              return [...filtered, cursor];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Clean up old cursors on mount
    const cleanupOldCursors = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from('pdf_collaboration_cursors')
        .delete()
        .eq('session_id', sessionId)
        .lt('last_active', fiveMinutesAgo);
    };

    cleanupOldCursors();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up PDF realtime');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      
      // Remove own cursor
      if (userId && sessionId) {
        supabase
          .from('pdf_collaboration_cursors')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .then(() => console.log('Cursor removed on cleanup'));
      }
    };
  }, [sessionId, userId]);

  // Clear processed remote operations
  useEffect(() => {
    if (remoteOperations.length > 0) {
      const timer = setTimeout(() => {
        setRemoteOperations([]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [remoteOperations]);

  return {
    collaborators,
    remoteOperations,
    updateCursor,
    isConnected,
  };
};
