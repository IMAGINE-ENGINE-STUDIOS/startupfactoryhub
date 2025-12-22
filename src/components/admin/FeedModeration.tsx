import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Trash2,
  MessageSquare,
  RefreshCw,
  MoreVertical,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Heart,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Post {
  id: string;
  content: string;
  post_type: string;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  user_id: string;
  media_urls?: string[] | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  details: string | null;
  status: string | null;
  created_at: string;
  reporter_id: string | null;
}

const FeedModeration = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'posts' | 'flags'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;
    
    const loadData = async () => {
      if (!isMounted) return;
      await fetchData();
    };
    
    loadData();

    // Debounced fetch for realtime updates
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) fetchData();
      }, 1000);
    };

    // Real-time subscription for feed posts
    const channel = supabase
      .channel('admin-feed-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feed_posts' },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_flags' },
        debouncedFetch
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsResult, flagsResult] = await Promise.all([
        supabase.from('feed_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('content_flags')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (postsResult.error) throw postsResult.error;

      // Fetch profiles separately for each post
      const postsWithProfiles = await Promise.all(
        (postsResult.data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, email')
            .eq('user_id', post.user_id)
            .single();
          return { ...post, profiles: profile } as Post;
        })
      );

      setPosts(postsWithProfiles);
      setFlags((flagsResult.data || []) as ContentFlag[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Deleted",
        description: "Post has been deleted"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const handleResolveFlag = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('content_flags')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setFlags(prev => prev.map(f => f.id === id ? { ...f, status } : f));
      toast({
        title: "Updated",
        description: `Flag marked as ${status}`
      });
    } catch (error) {
      console.error('Error updating flag:', error);
      toast({
        title: "Error",
        description: "Failed to update flag",
        variant: "destructive"
      });
    }
  };

  const getPostTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      text: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      image: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      video: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      cohort_announcement: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      internship_announcement: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };
    return styles[type] || 'bg-muted text-muted-foreground';
  };

  const getFlagStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      dismissed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status || 'pending'] || 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  const filteredPosts = posts.filter(p => 
    !searchQuery || 
    p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingFlags = flags.filter(f => f.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <MessageSquare className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Flag className="h-5 w-5 text-red-400 mb-2" />
            <p className="text-2xl font-bold">{flags.length}</p>
            <p className="text-xs text-muted-foreground">Total Flags</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold">{pendingFlags}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Heart className="h-5 w-5 text-rose-400 mb-2" />
            <p className="text-2xl font-bold">
              {posts.reduce((sum, p) => sum + (p.likes_count || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 tech-card border-0"
              />
            </div>
            <Select value={viewType} onValueChange={(v: 'posts' | 'flags') => setViewType(v)}>
              <SelectTrigger className="w-[180px] tech-card border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posts">All Posts</SelectItem>
                <SelectItem value="flags">Flagged Content</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData} className="tech-card border-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewType === 'posts' ? <MessageSquare className="h-5 w-5" /> : <Flag className="h-5 w-5" />}
            {viewType === 'posts' ? `Posts (${filteredPosts.length})` : `Flagged Content (${flags.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {viewType === 'posts' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.profiles?.avatar_url || ''} />
                            <AvatarFallback>{post.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{post.profiles?.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-[300px] whitespace-pre-wrap line-clamp-2">{post.content}</p>
                      </TableCell>
                      <TableCell>
                        {post.media_urls && post.media_urls.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4 text-purple-400" />
                            <span className="text-xs text-muted-foreground">{post.media_urls.length}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPostTypeBadge(post.post_type)}>
                          {post.post_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {post.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {post.comments_count || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(post.created_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedPost(post);
                              setShowDialog(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Full Post
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <Badge variant="outline">{flag.content_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{flag.reason}</TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-2">{flag.details || 'No details'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getFlagStatusBadge(flag.status)}>
                          {flag.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(flag.created_at), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResolveFlag(flag.id, 'resolved')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResolveFlag(flag.id, 'dismissed')}>
                              <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                              Dismiss
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Post Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="tech-card border-0 !transition-none max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedPost.profiles?.avatar_url || ''} />
                  <AvatarFallback>{selectedPost.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedPost.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPost.profiles?.email}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              
              {/* Media Gallery */}
              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-purple-400" />
                    Media ({selectedPost.media_urls.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
                    {selectedPost.media_urls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        {url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') ? (
                          <video src={url} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" /> {selectedPost.likes_count || 0} likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" /> {selectedPost.comments_count || 0} comments
                </span>
                <Badge variant="outline" className={getPostTypeBadge(selectedPost.post_type)}>
                  {selectedPost.post_type}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
            <Button variant="destructive" onClick={() => {
              if (selectedPost) handleDeletePost(selectedPost.id);
              setShowDialog(false);
            }}>
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedModeration;