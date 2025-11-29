import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, User, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BlogComments from "./BlogComments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface BlogPostCardProps {
  post: BlogPost;
}

const getGuestId = () => {
  let guestId = localStorage.getItem("blog_guest_id");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("blog_guest_id", guestId);
  }
  return guestId;
};

const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const authorName =
    post.profile?.full_name || post.guest_name || "Anonymous";
  const authorAvatar = post.profile?.avatar_url;

  // Check if user has liked the post
  const { data: hasLiked } = useQuery({
    queryKey: ["blog-like", post.id, user?.id],
    queryFn: async () => {
      if (user) {
        const { data } = await supabase
          .from("blog_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single();
        return !!data;
      } else {
        const guestId = getGuestId();
        const { data } = await supabase
          .from("blog_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("guest_identifier", guestId)
          .single();
        return !!data;
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (hasLiked) {
        // Unlike
        if (user) {
          await supabase
            .from("blog_likes")
            .delete()
            .eq("post_id", post.id)
            .eq("user_id", user.id);
        } else {
          const guestId = getGuestId();
          await supabase
            .from("blog_likes")
            .delete()
            .eq("post_id", post.id)
            .eq("guest_identifier", guestId);
        }
      } else {
        // Like
        await supabase.from("blog_likes").insert({
          post_id: post.id,
          user_id: user?.id || null,
          guest_identifier: user ? null : getGuestId(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-like", post.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Post deleted" });
    },
  });

  const canDelete = user && post.user_id === user.id;

  return (
    <div className="bg-card border border-border rounded-lg p-6 transition-all hover:border-primary/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{authorName}</span>
              {!post.user_id && (
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                  Guest
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => deleteMutation.mutate()}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <h2 className="text-xl font-futuristic font-semibold text-foreground mb-2">
        {post.title}
      </h2>
      <p className="text-muted-foreground whitespace-pre-wrap mb-4">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            hasLiked
              ? "text-red-500 bg-red-500/10"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
          <span className="text-sm">{post.likes_count}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            showComments
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">{post.comments_count}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && <BlogComments postId={post.id} />}
    </div>
  );
};

export default BlogPostCard;
