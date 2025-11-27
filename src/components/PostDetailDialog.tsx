import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, Share2, Bookmark, Play, Pause, Volume2, VolumeX, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  content: string;
  created_at: string;
  post_type: string;
  media_urls?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  user_id: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface PostDetailDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLikeToggle?: () => void;
}

export const PostDetailDialog = ({ post, open, onOpenChange, onLikeToggle }: PostDetailDialogProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (post && open) {
      setLikesCount(post.likes_count || 0);
      setCommentsCount(post.comments_count || 0);
      fetchInteractionStatus();
      fetchComments();
      fetchAuthorProfile();
      
      // Auto-play video when dialog opens
      if (videoRef.current && isVideoUrl(post.media_urls?.[0] || '')) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [post, open]);

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('storage/')) {
      const path = url.replace('storage/', '');
      return `https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/${path}`;
    }
    return url;
  };

  const fetchAuthorProfile = async () => {
    if (!post) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', post.user_id)
      .single();
    
    if (data) setAuthorProfile(data);
  };

  const fetchInteractionStatus = async () => {
    if (!post || !user) return;

    const [likeResult, bookmarkResult] = await Promise.all([
      supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single(),
      supabase.from('post_bookmarks').select('id').eq('post_id', post.id).eq('user_id', user.id).single()
    ]);

    setIsLiked(!!likeResult.data);
    setIsBookmarked(!!bookmarkResult.data);
  };

  const fetchComments = async () => {
    if (!post) return;

    const { data } = await supabase
      .from('post_comments')
      .select('id, content, created_at, user_id')
      .eq('post_id', post.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const commentsWithProfiles = data.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || { full_name: 'Unknown', avatar_url: '' }
      }));

      setComments(commentsWithProfiles as Comment[]);
    }
  };

  const toggleLike = async () => {
    if (!post || !user) {
      toast.error('Please sign in to like posts');
      return;
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    if (newIsLiked) {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    }

    await supabase.from('feed_posts').update({ 
      likes_count: newIsLiked ? (post.likes_count || 0) + 1 : (post.likes_count || 0) - 1 
    }).eq('id', post.id);

    onLikeToggle?.();
  };

  const toggleBookmark = async () => {
    if (!post || !user) {
      toast.error('Please sign in to bookmark posts');
      return;
    }

    const newIsBookmarked = !isBookmarked;
    setIsBookmarked(newIsBookmarked);

    if (newIsBookmarked) {
      await supabase.from('post_bookmarks').insert({ post_id: post.id, user_id: user.id });
      toast.success('Post bookmarked');
    } else {
      await supabase.from('post_bookmarks').delete().eq('post_id', post.id).eq('user_id', user.id);
      toast.success('Bookmark removed');
    }
  };

  const handleAddComment = async () => {
    if (!post || !user || !newComment.trim()) return;

    const { error } = await supabase.from('post_comments').insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim()
    });

    if (error) {
      toast.error('Failed to add comment');
      return;
    }

    const newCount = commentsCount + 1;
    setCommentsCount(newCount);
    await supabase.from('feed_posts').update({ comments_count: newCount }).eq('id', post.id);
    
    setNewComment('');
    fetchComments();
    toast.success('Comment added');
  };

  const handleShare = () => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!post) return null;

  const hasMedia = post.media_urls && post.media_urls.length > 0;
  const mediaUrl = hasMedia ? getMediaUrl(post.media_urls![0]) : '';
  const isVideo = hasMedia && isVideoUrl(mediaUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <div className="grid md:grid-cols-2 gap-0 h-full">
          {/* Media Section */}
          <div className="relative bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {isVideo ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isMuted}
                  onClick={togglePlayPause}
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-background/80 hover:bg-background"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-background/80 hover:bg-background"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : hasMedia ? (
              <img src={mediaUrl} alt="Post media" className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-muted">
                <p className="text-muted-foreground">No media</p>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex flex-col h-full">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={authorProfile?.avatar_url} />
                  <AvatarFallback>{authorProfile?.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{authorProfile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="secondary">{post.post_type}</Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 p-4 overflow-y-auto">
              <p className="text-sm mb-4">{post.content}</p>

              <div className="flex items-center gap-4 pb-4 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={toggleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{likesCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{commentsCount}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBookmark}
                  className="ml-auto"
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <ScrollArea className="h-[200px] mt-4">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles.avatar_url} />
                        <AvatarFallback>{comment.profiles.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{comment.profiles.full_name}</p>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
