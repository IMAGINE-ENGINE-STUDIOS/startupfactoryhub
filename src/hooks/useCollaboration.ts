import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  userEmail: string;
  x: number;
  y: number;
  color: string;
  lastSeen: string;
}

export interface CollaboratorPresence {
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
  joinedAt: string;
}

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

export const useCollaboration = (sessionId: string | null) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [cursors, setCursors] = useState<Map<string, CollaboratorCursor>>(new Map());
  const [activeUsers, setActiveUsers] = useState<CollaboratorPresence[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [userColor, setUserColor] = useState<string>('');

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, email: user.email || 'Anonymous' });
        // Assign random color to current user
        setUserColor(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);
      }
    };
    getUser();
  }, []);

  // Track cursor movement
  const trackCursor = useCallback((x: number, y: number) => {
    if (!channel || !currentUser) return;

    channel.track({
      userId: currentUser.id,
      userName: currentUser.email.split('@')[0],
      userEmail: currentUser.email,
      x,
      y,
      color: userColor,
      lastSeen: new Date().toISOString(),
    });
  }, [channel, currentUser, userColor]);

  // Setup collaboration channel
  useEffect(() => {
    if (!sessionId || !currentUser) return;

    const collaborationChannel = supabase.channel(`pdf-session-${sessionId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    // Handle presence sync
    collaborationChannel
      .on('presence', { event: 'sync' }, () => {
        const state = collaborationChannel.presenceState();
        const users: CollaboratorPresence[] = [];
        const cursorMap = new Map<string, CollaboratorCursor>();

        Object.keys(state).forEach((userId) => {
          const presences = state[userId] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            
            // Add to active users list
            if (userId !== currentUser.id) {
              users.push({
                userId: presence.userId,
                userName: presence.userName,
                userEmail: presence.userEmail,
                color: presence.color,
                joinedAt: presence.lastSeen,
              });

              // Add cursor data
              cursorMap.set(userId, {
                userId: presence.userId,
                userName: presence.userName,
                userEmail: presence.userEmail,
                x: presence.x || 0,
                y: presence.y || 0,
                color: presence.color,
                lastSeen: presence.lastSeen,
              });
            }
          }
        });

        setActiveUsers(users);
        setCursors(cursorMap);
      })
      .on('presence', { event: 'join' }, () => {
        // Silently handle join - presence state will update
      })
      .on('presence', { event: 'leave' }, () => {
        // Silently handle leave - presence state will update
      });

    // Subscribe and track initial presence
    collaborationChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await collaborationChannel.track({
          userId: currentUser.id,
          userName: currentUser.email.split('@')[0],
          userEmail: currentUser.email,
          x: 0,
          y: 0,
          color: userColor,
          lastSeen: new Date().toISOString(),
        });
      }
    });

    setChannel(collaborationChannel);

    // Cleanup
    return () => {
      collaborationChannel.unsubscribe();
    };
  }, [sessionId, currentUser, userColor]);

  return {
    cursors: Array.from(cursors.values()),
    activeUsers,
    trackCursor,
    currentUser,
    userColor,
  };
};
