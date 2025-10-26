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
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch user profiles for comments
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]));

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: repliesData } = await supabase
            .from('pdf_comment_replies')
            .select('*')
            .eq('comment_id', comment.id)
            .order('created_at', { ascending: true });

          // Fetch user profiles for replies
          const replyUserIds = [...new Set(repliesData?.map(r => r.user_id) || [])];
          const { data: replyUsersData } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .in('user_id', replyUserIds);

          const replyUsersMap = new Map(replyUsersData?.map(u => [u.user_id, u]));

          return {
            ...comment,
            user: usersMap.get(comment.user_id),
            replies: (repliesData || []).map(reply => ({
              ...reply,
              user: replyUsersMap.get(reply.user_id),
            })),
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

      const { data: commentsData, error } = await supabase
        .from('pdf_comments')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          page_number: pageNumber,
          x_position: x,
          y_position: y,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .eq('user_id', user.id)
        .single();

      toast.success('Comment added');
      return {
        ...commentsData,
        user: userData,
      };
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

      const { data: replyData, error } = await supabase
        .from('pdf_comment_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .eq('user_id', user.id)
        .single();

      toast.success('Reply added');
      return {
        ...replyData,
        user: userData,
      };
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
