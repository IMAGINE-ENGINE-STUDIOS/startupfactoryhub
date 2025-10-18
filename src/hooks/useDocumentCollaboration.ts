import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [myCursorId, setMyCursorId] = useState<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

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

  // Update cursor position
  const updateCursor = useCallback(async (
    x: number,
    y: number,
    selection?: { start: number; end: number }
  ) => {
    if (!user || !projectId || !enabled) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const cursorData = {
        project_id: projectId,
        user_id: user.id,
        user_name: profile?.full_name || user.email || 'User',
        user_avatar: profile?.avatar_url,
        user_color: myColor,
        position: { x, y, selection },
        last_active: new Date().toISOString(),
      };

      if (myCursorId) {
        // Update existing cursor
        await supabase
          .from('document_cursors')
          .update(cursorData)
          .eq('id', myCursorId);
      } else {
        // Create new cursor
        const { data, error } = await supabase
          .from('document_cursors')
          .insert(cursorData)
          .select()
          .single();

        if (!error && data) {
          setMyCursorId(data.id);
        }
      }
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }, [user, projectId, myColor, myCursorId, enabled]);

  // Load active cursors
  const loadCursors = useCallback(async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('document_cursors')
        .select('*')
        .eq('project_id', projectId)
        .gte('last_active', new Date(Date.now() - 30000).toISOString()); // Active in last 30 seconds

      if (error) throw error;
      if (data) {
        // Filter out my own cursor
        setCursors(data.filter(cursor => cursor.id !== myCursorId) as unknown as CursorPosition[]);
      }
    } catch (error) {
      console.error('Error loading cursors:', error);
    }
  }, [projectId, myCursorId]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!projectId || !enabled) return;

    loadComments();
    loadCursors();

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

    // Subscribe to cursors
    const cursorsChannel = supabase
      .channel(`project-${projectId}-cursors`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_cursors',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadCursors();
        }
      )
      .subscribe();

    // Update cursor position periodically to keep it alive
    updateIntervalRef.current = setInterval(() => {
      if (myCursorId) {
        supabase
          .from('document_cursors')
          .update({ last_active: new Date().toISOString() })
          .eq('id', myCursorId)
          .then();
      }
    }, 10000); // Update every 10 seconds

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(cursorsChannel);
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      // Clean up cursor on unmount
      if (myCursorId) {
        supabase
          .from('document_cursors')
          .delete()
          .eq('id', myCursorId)
          .then();
      }
    };
  }, [projectId, enabled, loadComments, loadCursors, myCursorId]);

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
