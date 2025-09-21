import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share, Plus, Zap, TrendingUp, Users } from 'lucide-react';

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_type: string;
  profiles?: {
    full_name: string;
    role: string;
    avatar_url?: string;
  } | null;
  post_likes: { user_id: string }[];
  post_comments: { 
    id: string; 
    content: string; 
    created_at: string; 
    user_id: string;
  }[];
  _count?: {
    post_likes: number;
    post_comments: number;
  };
}

interface UnifiedCommunityFeedProps {
  showCreatePost?: boolean;
  maxHeight?: string;
  limit?: number;
}

export default function UnifiedCommunityFeed({ 
  showCreatePost = true, 
  maxHeight = "600px",
  limit = 10 
}: UnifiedCommunityFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }
    
    // Set up real-time subscription
    const channel = supabase
      .channel('feed-posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        () => fetchPosts()
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        () => { fetchPosts(); if (user) fetchUserLikes(); }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        () => { fetchPosts(); if (user) fetchUserLikes(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  const fetchPosts = async () => {
    // First fetch posts without profile joins
    const { data: postsData, error: postsError } = await supabase
      .from('feed_posts')
      .select(`
        *,
        post_likes (user_id),
        post_comments (
          id,
          content,
          created_at,
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }

    // Get unique user IDs from posts
    const userIds = [...new Set(postsData?.map(post => post.user_id).filter(Boolean) || [])];
    
    // Fetch profiles for those users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, avatar_url')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Create a map of profiles by user_id
    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {} as Record<string, any>);

    const formattedPosts = (postsData || []).map(post => ({
      ...post,
      profiles: profilesMap[post.user_id] || null,
      _count: {
        post_likes: post.post_likes?.length || 0,
        post_comments: post.post_comments?.length || 0
      }
    }));
    
    setPosts(formattedPosts);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    
    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from('feed_posts')
      .insert({
        content: newPost,
        user_id: user.id,
        post_type: 'update'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } else {
      setNewPost('');
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    }
    setLoading(false);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);
    
    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      
      if (!error) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      
      if (!error) {
        setLikedPosts(prev => new Set([...prev, postId]));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'startup': return '🚀';
      case 'investor': return '💰';
      case 'mentor': return '🎯';
      case 'advisor': return '🧠';
      case 'student': return '🎓';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Community Feed</h2>
            <p className="text-muted-foreground">Connect and share with the startup ecosystem</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{posts.length} posts</span>
        </Badge>
      </div>

      {/* Create Post */}
      {showCreatePost && user && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Share your journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's happening in your startup journey? Share updates, insights, or ask for advice..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary"
            />
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Badge variant="secondary" className="text-xs">Update</Badge>
                <Badge variant="secondary" className="text-xs">Question</Badge>
                <Badge variant="secondary" className="text-xs">Milestone</Badge>
              </div>
              <Button 
                onClick={createPost}
                disabled={loading || !newPost.trim()}
                className="pulse-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Posting...' : 'Share'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Grid */}
      <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        {posts.map((post) => (
          <Card key={post.id} className="tech-card border-0 hover:scale-[1.01] transition-all">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <Avatar className="h-12 w-12">
                  {post.profiles?.avatar_url ? (
                    <AvatarImage src={post.profiles.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {post.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">
                        {post.profiles?.full_name || 'Anonymous User'}
                      </h3>
                      <span className="text-lg">{getRoleIcon(post.profiles?.role || '')}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {post.profiles?.role || 'Member'}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  
                  <div className="flex items-center space-x-6 pt-3 border-t border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-muted-foreground hover:text-primary ${
                        user && likedPosts.has(post.id) ? 'text-red-500' : ''
                      }`}
                      onClick={() => user && toggleLike(post.id)}
                      disabled={!user}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${
                        user && likedPosts.has(post.id) ? 'fill-current' : ''
                      }`} />
                      {post._count?.post_likes || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {post._count?.post_comments || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <Card className="tech-card border-0 text-center p-12">
          <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">Be the first to share your startup journey!</p>
        </Card>
      )}
    </div>
  );
}