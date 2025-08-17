import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  TrendingUp, 
  Users, 
  Search,
  Filter,
  Plus,
  Bookmark,
  MoreHorizontal,
  UserPlus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

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
  // Join data
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

const SocialFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: PostComment[] }>({});
  const [newComment, setNewComment] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPosts();
    fetchUserLikes();
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('feed_posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            role,
            company_name,
            position
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq('post_type', filter);
      }

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      setLikedPosts(new Set(data?.map(like => like.post_id) || []));
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      setComments(prev => ({
        ...prev,
        [postId]: (data as any) || []
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('feed_posts')
        .insert({
          content: newPost,
          user_id: user.id,
          tags: selectedTags,
          post_type: 'update'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      setNewPost("");
      setSelectedTags([]);
      await fetchPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await supabase
          .from('post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
        
        setLikedPosts(prev => new Set([...prev, postId]));
      }

      // Update post likes count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: post.likes_count + (isLiked ? -1 : 1) }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          content: newComment,
          user_id: user.id,
          post_id: postId
        });

      if (error) throw error;

      setNewComment("");
      await fetchComments(postId);
      
      // Update comments count
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const availableTags = ["startup", "funding", "tech", "ai", "growth", "hiring", "product", "marketing"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Startup Feed
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <h3 className="font-semibold">Filters</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Post Type</h4>
                  <div className="space-y-2">
                    {["all", "update", "announcement", "question", "achievement"].map((type) => (
                      <Button
                        key={type}
                        variant={filter === type ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setFilter(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Trending Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 6).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer text-xs"
                        onClick={() => setSearchQuery(`#${tag}`)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
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
                  
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag) 
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Media
                      </Button>
                    </div>
                    <Button onClick={createPost} disabled={!newPost.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Post
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
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback>
                            {post.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{post.profiles?.full_name || 'Anonymous'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {post.profiles?.position && post.profiles?.company_name 
                              ? `${post.profiles.position} at ${post.profiles.company_name}`
                              : post.profiles?.role
                            } • {formatDistanceToNow(new Date(post.created_at))} ago
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <div>
                      <p className="text-foreground leading-relaxed">{post.content}</p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(post.id)}
                          className={likedPosts.has(post.id) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 mr-2 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const postId = post.id;
                            setShowComments(showComments === postId ? null : postId);
                            if (showComments !== postId) {
                              fetchComments(postId);
                            }
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {post.comments_count}
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {showComments === post.id && (
                      <div className="border-t pt-4 space-y-4">
                        {/* Add Comment */}
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              placeholder="Write a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
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
                                <AvatarFallback className="text-xs">
                                  {comment.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">
                                      {comment.profiles?.full_name || 'Anonymous'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.created_at))} ago
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
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

            {posts.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">Be the first to share something with the community!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              {/* Trending */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["AI Startup Funding", "SaaS Growth Hacks", "MVP Development", "Pitch Deck Tips"].map((trend, idx) => (
                    <div key={idx} className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                      <p className="font-medium text-sm">#{trend.replace(/\s+/g, '')}</p>
                      <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 500) + 100} posts</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Suggested Connections */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Suggested Connections
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback>
                          {post.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {post.profiles?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {post.profiles?.role}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;