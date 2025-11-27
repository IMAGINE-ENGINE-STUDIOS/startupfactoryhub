import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MessageCircle, Share2, Play, Calendar,
  Image as ImageIcon, FileText, Loader2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostDetailDialog } from './PostDetailDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: string;
  content: string;
  post_type: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  user_id: string;
}

interface ProfilePostsMosaicProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function ProfilePostsMosaic({ userId, isOwnProfile = false }: ProfilePostsMosaicProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const LIMIT = 12;

  useEffect(() => {
    if (userId) {
      fetchPosts();
      if (user) fetchUserLikes();
    }
  }, [userId, user]);

  // Real-time subscription for comments only
  useEffect(() => {
    if (!userId) return;

    let commentDebounceTimer: NodeJS.Timeout;

    const channel = supabase
      .channel(`profile-posts-${userId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        () => {
          // Debounce comment updates to avoid rapid refetches
          clearTimeout(commentDebounceTimer);
          commentDebounceTimer = setTimeout(() => fetchPosts(), 500);
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        (payload) => {
          // Remove deleted post from list (syncs when deleted from social tab too)
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          if (selectedPost?.id === payload.old.id) {
            setSelectedPost(null);
            setIsDialogOpen(false);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(commentDebounceTimer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

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

  const fetchPosts = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const currentOffset = loadMore ? offset : 0;
      
      const { data, error } = await supabase
        .from('feed_posts')
        .select('id, content, post_type, media_urls, likes_count, comments_count, shares_count, created_at, user_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + LIMIT - 1);

      if (error) throw error;

      if (data) {
        if (loadMore) {
          setPosts(prev => [...prev, ...data]);
        } else {
          setPosts(data);
        }
        setOffset(currentOffset + data.length);
        setHasMore(data.length === LIMIT);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    // Optimistically update liked posts Set
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return newSet;
    });

    // Update post counts optimistically
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1 }
        : p
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPost(null);
  };

  const getMosaicClass = (post: Post, index: number) => {
    // Shorts are tall
    if (post.post_type === 'short') {
      return 'row-span-2';
    }
    // Posts with media are standard
    if (post.media_urls && post.media_urls.length > 0) {
      return 'row-span-1';
    }
    // Text-only posts are small
    return 'row-span-1';
  };

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getMediaUrl = (url: string) => {
    // If URL is already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If URL is a Supabase storage path, construct the full URL
    if (url.startsWith('storage/')) {
      const path = url.replace('storage/', '');
      return `https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/${path}`;
    }
    
    return url;
  };

  const renderPostContent = (post: Post) => {
    const hasMedia = post.media_urls && post.media_urls.length > 0;
    const isShort = post.post_type === 'short';
    const isEvent = post.post_type === 'event';

    if (isShort && hasMedia) {
      const mediaUrl = getMediaUrl(post.media_urls![0]);
      const isVideo = isVideoUrl(mediaUrl);
      
      return (
        <div 
          className="relative w-full h-full group cursor-pointer"
          onClick={() => handlePostClick(post)}
        >
          {isVideo ? (
            <video 
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              onError={(e) => {
                console.error('Video load error:', e);
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt="Short"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image load error for short:', mediaUrl);
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          )}
          <div className="hidden absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/90 rounded-full p-4">
              <Play className="h-8 w-8 text-primary fill-primary" />
            </div>
          </div>
          <Badge className="absolute top-2 right-2 bg-primary/90">Short</Badge>
        </div>
      );
    }

    if (hasMedia) {
      const mediaUrl = getMediaUrl(post.media_urls![0]);
      const isVideo = isVideoUrl(mediaUrl);
      
      return (
        <div 
          className="relative w-full h-full group cursor-pointer"
          onClick={() => handlePostClick(post)}
        >
          {isVideo ? (
            <video 
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              onError={(e) => {
                console.error('Video load error:', e);
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt="Post media"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image load error:', mediaUrl);
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          )}
          <div className="hidden absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          {post.media_urls!.length > 1 && (
            <Badge className="absolute top-2 right-2 bg-background/90 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {post.media_urls!.length}
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }

    if (isEvent) {
      return (
        <div 
          className="relative w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => handlePostClick(post)}
        >
          <Calendar className="h-12 w-12 text-primary mb-2" />
          <p className="text-sm text-center font-medium line-clamp-3 mt-2">
            {post.content}
          </p>
          <Badge className="absolute top-2 right-2 bg-primary/90">Event</Badge>
        </div>
      );
    }

    // Text-only post
    return (
      <div 
        className="relative w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-4 cursor-pointer"
        onClick={() => handlePostClick(post)}
      >
        <FileText className="absolute top-2 left-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-center line-clamp-4 font-medium">
          {post.content}
        </p>
      </div>
    );
  };

  const renderEngagementOverlay = (post: Post) => {
    const isLiked = likedPosts.has(post.id);
    
    return (
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-white text-sm">
          <div className="flex items-center gap-1">
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{post.likes_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </div>
          {post.shares_count > 0 && (
            <div className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>{post.shares_count}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-white/80 mt-1">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground">
          {isOwnProfile 
            ? "Start sharing your journey with the community!" 
            : "This user hasn't posted anything yet."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mosaic Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[200px] gap-3">
        {posts.map((post, index) => (
          <Card
            key={post.id}
            className={`${getMosaicClass(post, index)} overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group relative`}
          >
            {renderPostContent(post)}
            {renderEngagementOverlay(post)}
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchPosts(true)}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      <PostDetailDialog
        post={selectedPost}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onLikeToggle={handleLikeToggle}
        onDelete={handlePostDelete}
      />
    </div>
  );
}
