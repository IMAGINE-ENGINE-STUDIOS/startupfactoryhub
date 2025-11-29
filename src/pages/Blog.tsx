import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BlogCreatePost from "@/components/blog/BlogCreatePost";
import MatrixBackground from "@/components/MatrixBackground";
import { Loader2, PenSquare } from "lucide-react";

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

const Blog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for user posts
      const userIds = data
        .filter((p) => p.user_id)
        .map((p) => p.user_id as string);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        return data.map((post) => ({
          ...post,
          profile: profiles?.find((p) => p.user_id === post.user_id) || null,
        }));
      }

      return data.map((post) => ({ ...post, profile: null }));
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      guestName,
    }: {
      title: string;
      content: string;
      guestName?: string;
    }) => {
      const { error } = await supabase.from("blog_posts").insert({
        title,
        content,
        user_id: user?.id || null,
        guest_name: user ? null : guestName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setShowCreatePost(false);
    },
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixBackground />
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Community Blog
              </h1>
              <p className="text-muted-foreground">
                Share your thoughts, ideas, and experiences with the community
              </p>
            </div>
            <button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PenSquare className="h-4 w-4" />
              Write Post
            </button>
          </div>

          {/* Create Post Form */}
          {showCreatePost && (
            <BlogCreatePost
              user={user}
              onSubmit={(title, content, guestName) =>
                createPostMutation.mutate({ title, content, guestName })
              }
              isLoading={createPostMutation.isPending}
              onCancel={() => setShowCreatePost(false)}
            />
          )}
        </div>

        {/* Posts List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <BlogPostCard key={post.id} post={post as BlogPost} />
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <PenSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No posts yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share something with the community!
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create First Post
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
