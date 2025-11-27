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

interface Post {
  id: string;
  content: string;
  post_type: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
}

interface ProfilePostsMosaicProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function ProfilePostsMosaic({ userId, isOwnProfile = false }: ProfilePostsMosaicProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;

  useEffect(() => {
    if (userId) {
      fetchPosts();
    }
  }, [userId]);

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
        .select('id, content, post_type, media_urls, likes_count, comments_count, shares_count, created_at')
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

  const renderPostContent = (post: Post) => {
    const hasMedia = post.media_urls && post.media_urls.length > 0;
    const isShort = post.post_type === 'short';
    const isEvent = post.post_type === 'event';

    if (isShort && hasMedia) {
      return (
        <div className="relative w-full h-full group">
          <img 
            src={post.media_urls![0]} 
            alt="Short"
            className="w-full h-full object-cover"
          />
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
      return (
        <div className="relative w-full h-full group">
          <img 
            src={post.media_urls![0]} 
            alt="Post media"
            className="w-full h-full object-cover"
          />
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
        <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
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
      <div className="relative w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center p-4">
        <FileText className="absolute top-2 left-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-center line-clamp-4 font-medium">
          {post.content}
        </p>
      </div>
    );
  };

  const renderEngagementOverlay = (post: Post) => (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-4 text-white text-sm">
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
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
    </div>
  );
}
