import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Comment {
  id: string;
  session_id: string;
  user_id: string;
  page_number: number;
  x_position: number;
  y_position: number;
  content: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  replies?: CommentReply[];
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useComments = (sessionId: string | null) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      
      // Fetch comments with user info
      const { data: commentsData, error: commentsError } = await supabase
        .from('pdf_comments')
        .select(`
          *,
          user:profiles!pdf_comments_user_id_fkey(full_name, email, avatar_url)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: repliesData } = await supabase
            .from('pdf_comment_replies')
            .select(`
              *,
              user:profiles!pdf_comment_replies_user_id_fkey(full_name, email, avatar_url)
            `)
            .eq('comment_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: repliesData || [],
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Add comment
  const addComment = useCallback(async (
    pageNumber: number,
    x: number,
    y: number,
    content: string
  ) => {
    if (!sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pdf_comments')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          page_number: pageNumber,
          x_position: x,
          y_position: y,
          content,
        })
        .select(`
          *,
          user:profiles!pdf_comments_user_id_fkey(full_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;

      toast.success('Comment added');
      return data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  }, [sessionId]);

  // Add reply
  const addReply = useCallback(async (commentId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pdf_comment_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          content,
        })
        .select(`
          *,
          user:profiles!pdf_comment_replies_user_id_fkey(full_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;

      toast.success('Reply added');
      return data;
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  }, []);

  // Toggle resolved status
  const toggleResolved = useCallback(async (commentId: string, resolved: boolean) => {
    try {
      const { error } = await supabase
        .from('pdf_comments')
        .update({ resolved })
        .eq('id', commentId);

      if (error) throw error;

      toast.success(resolved ? 'Comment resolved' : 'Comment reopened');
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  }, []);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('pdf_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment deleted');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    fetchComments();

    const commentsChannel = supabase
      .channel(`pdf-comments-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdf_comments',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdf_comment_replies',
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    setChannel(commentsChannel);

    return () => {
      commentsChannel.unsubscribe();
    };
  }, [sessionId, fetchComments]);

  return {
    comments,
    isLoading,
    addComment,
    addReply,
    toggleResolved,
    deleteComment,
    refetch: fetchComments,
  };
};
