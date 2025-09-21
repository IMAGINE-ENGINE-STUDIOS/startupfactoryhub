import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Search,
  Plus,
  Bookmark
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import DashboardNavigation from "@/components/DashboardNavigation";

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  post_type: string;
  tags: string[];
  media_urls?: string[];
  profiles?: {
    full_name: string;
    avatar_url?: string;
    role: string;
    company_name?: string;
    position?: string;
  } | null;
}

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
    role: string;
  } | null;
}

const CommunityFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Use sample data since feed tables don't exist yet
    if (user) {
      setPosts([]);
    }
  }, [user, searchQuery]);

  const fetchPosts = async () => {
    // Placeholder - will be implemented when feed tables are created
    setPosts([]);
  };

  const fetchUserLikes = async () => {
    // Placeholder - will be implemented when feed tables are created
    setLikedPosts(new Set());
  };

  const fetchComments = async (postId: string) => {
    // Placeholder - will be implemented when feed tables are created
    setComments(prev => ({ ...prev, [postId]: [] }));
  };

  const createPost = async () => {
    toast({
      title: "Feature coming soon",
      description: "Post creation will be available once feed tables are set up.",
    });
  };

  const toggleLike = async (postId: string) => {
    toast({
      title: "Feature coming soon", 
      description: "Like functionality will be available once feed tables are set up.",
    });
  };

  const addComment = async (postId: string) => {
    toast({
      title: "Feature coming soon",
      description: "Comments will be available once feed tables are set up.",
    });
  };

  const toggleComments = (postId: string) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'startup': return <Building2 className="w-4 h-4" />;
      case 'investor': return <TrendingUp className="w-4 h-4" />;
      case 'mentor': return <Users className="w-4 h-4" />;
      case 'student': return <GraduationCap className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'startup': return 'bg-blue-100 text-blue-800';
      case 'investor': return 'bg-green-100 text-green-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Sign in to view the community feed</h2>
              <p className="text-muted-foreground mb-6">
                Join our community to connect with startups, mentors, investors, and students.
              </p>
              <Button onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
            <p className="text-muted-foreground">
              Connect, share, and learn from the startup community
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Create Post */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="What's happening in your startup journey?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tags
                      </Button>
                    </div>
                    <Button onClick={createPost} disabled={loading || !newPost.trim()}>
                      {loading ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback>
                            {post.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{post.profiles?.full_name}</h3>
                            <Badge variant="secondary" className={`text-xs ${getRoleColor(post.profiles?.role || '')}`}>
                              {getRoleIcon(post.profiles?.role || '')}
                              <span className="ml-1 capitalize">{post.profiles?.role}</span>
                            </Badge>
                          </div>
                          {post.profiles?.company_name && (
                            <p className="text-sm text-muted-foreground">
                              {post.profiles.position} at {post.profiles.company_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at))} ago
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-3">
                      <p className="text-foreground leading-relaxed">{post.content}</p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(post.id)}
                          className={likedPosts.has(post.id) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments_count}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {activeCommentPost === post.id && (
                      <div className="border-t pt-4 space-y-4">
                        {/* Add Comment */}
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback>
                              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addComment(post.id);
                                }
                              }}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => addComment(post.id)}
                              disabled={!newComment.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {comment.profiles?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted rounded-lg p-3">
                                  <p className="font-semibold text-sm">{comment.profiles?.full_name}</p>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(comment.created_at))} ago
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {posts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to share something with the community!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityFeed;