import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  guest_name: string | null;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface BlogCommentsProps {
  postId: string;
}

const BlogComments = ({ postId }: BlogCommentsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["blog-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for user comments
      const userIds = data
        .filter((c) => c.user_id)
        .map((c) => c.user_id as string);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        return data.map((comment) => ({
          ...comment,
          profile: profiles?.find((p) => p.user_id === comment.user_id) || null,
        }));
      }

      return data.map((comment) => ({ ...comment, profile: null }));
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!newComment.trim()) return;
      if (!user && !guestName.trim()) return;

      const { error } = await supabase.from("blog_comments").insert({
        post_id: postId,
        content: newComment,
        user_id: user?.id || null,
        guest_name: user ? null : guestName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setNewComment("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("blog_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCommentMutation.mutate();
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        {!user && (
          <Input
            type="text"
            placeholder="Your name (as a guest)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mb-2"
            required
          />
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <Button
            type="submit"
            size="icon"
            disabled={createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment: Comment) => {
            const authorName =
              comment.profile?.full_name || comment.guest_name || "Anonymous";
            const authorAvatar = comment.profile?.avatar_url;
            const canDelete = user && comment.user_id === user.id;

            return (
              <div
                key={comment.id}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={authorAvatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {authorName}
                    </span>
                    {!comment.user_id && (
                      <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                        Guest
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};

export default BlogComments;
