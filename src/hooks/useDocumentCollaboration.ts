import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RealtimeChannel } from '@supabase/supabase-js';

interface CursorPosition {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_color: string;
  position: {
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  last_active: string;
}

interface Comment {
  id: string;
  project_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  content: string;
  position?: { x: number; y: number };
  thread_id?: string;
  created_at: string;
  updated_at: string;
}

interface UseDocumentCollaborationProps {
  projectId: string | null;
  enabled?: boolean;
}

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DFE6E9", "#74B9FF", "#A29BFE", "#FD79A8", "#FDCB6E"
];

export function useDocumentCollaboration({ projectId, enabled = true }: UseDocumentCollaborationProps) {
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [myColor] = useState(() => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);
  const channelRef = useRef<RealtimeChannel>();

  // Load existing comments
  const loadComments = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setComments(data as Comment[]);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, [projectId]);

  // Add a comment
  const addComment = useCallback(async (
    content: string,
    position?: { x: number; y: number },
    threadId?: string
  ) => {
    if (!user || !projectId) {
      toast.error("Please sign in to comment");
      return null;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          user_name: profile?.full_name || user.email || 'User',
          user_avatar: profile?.avatar_url,
          content,
          position,
          thread_id: threadId,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Comment added");
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
      return null;
    }
  }, [user, projectId]);

  // Update a comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('document_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Comment updated");
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error("Failed to update comment");
    }
  }, [user]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Comment deleted");
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Failed to delete comment");
    }
  }, [user]);

  // Update cursor position via Presence (instant, no database lag)
  const updateCursor = useCallback(async (
    x: number,
    y: number,
    selection?: { start: number; end: number }
  ) => {
    if (!user || !projectId || !enabled || !channelRef.current) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      await channelRef.current.track({
        user_id: user.id,
        user_name: profile?.full_name || user.email || 'User',
        user_avatar: profile?.avatar_url,
        user_color: myColor,
        position: { x, y, selection },
        online_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [user, projectId, myColor, enabled]);

  // Setup real-time subscriptions with Presence for cursors
  useEffect(() => {
    if (!projectId || !enabled || !user) return;

    loadComments();

    // Subscribe to comments
    const commentsChannel = supabase
      .channel(`project-${projectId}-comments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_comments',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    // Use Presence for instant cursor updates (no database)
    const presenceChannel = supabase.channel(`doc:${projectId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const allCursors = Object.values(state).flat() as any[];
        setCursors(allCursors.filter((c: any) => c.user_id !== user.id) as CursorPosition[]);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (newPresences[0]?.user_name) {
          toast.info(`${newPresences[0].user_name} joined`);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (leftPresences[0]?.user_name) {
          toast.info(`${leftPresences[0].user_name} left`);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', user.id)
            .maybeSingle();

          await presenceChannel.track({
            user_id: user.id,
            user_name: profile?.full_name || user.email || 'User',
            user_avatar: profile?.avatar_url,
            user_color: myColor,
            position: { x: 0, y: 0 },
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(commentsChannel);
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [projectId, enabled, user, loadComments, myColor]);

  return {
    cursors,
    comments,
    myColor,
    addComment,
    updateComment,
    deleteComment,
    updateCursor,
  };
}
