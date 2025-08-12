import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share, Plus, TrendingUp, Users, Zap } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  post_type: string;
  tags: string[];
  profiles?: {
    full_name: string;
    avatar_url: string;
    role: string;
    company_name: string;
  } | null;
}

export default function FeedDashboard() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url,
          role,
          company_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    setPosts(data || []);
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
      fetchPosts();
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <img src={companyLogo} alt="Company Logo" className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Startup Feed
              </h1>
              <p className="text-muted-foreground">Connect, share, and grow together</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Card className="tech-card p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Trending</span>
              </div>
            </Card>
            <Card className="tech-card p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">Communities</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Create Post */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>What's happening in your startup journey?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your progress, insights, or ask for advice..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary"
            />
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Badge variant="secondary" className="text-xs">Progress Update</Badge>
                <Badge variant="secondary" className="text-xs">Question</Badge>
                <Badge variant="secondary" className="text-xs">Milestone</Badge>
              </div>
              <Button 
                onClick={createPost}
                disabled={loading || !newPost.trim()}
                className="pulse-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {post.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {post.profiles?.full_name || 'Anonymous'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {post.profiles?.role || 'Member'}
                          </Badge>
                          {post.profiles?.company_name && (
                            <span>at {post.profiles.company_name}</span>
                          )}
                          <span>•</span>
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-foreground leading-relaxed">{post.content}</p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-6 pt-3 border-t border-border">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <Heart className="h-4 w-4 mr-2" />
                        {post.likes_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments_count || 0}
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
    </div>
  );
}