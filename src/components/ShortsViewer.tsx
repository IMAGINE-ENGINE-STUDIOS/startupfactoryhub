import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserProfileDialog from "@/components/UserProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2,
  Volume2,
  VolumeX,
  Zap,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Short {
  id: string;
  video_url: string;
  content: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface ShortsViewerProps {
  shorts: Short[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const ShortsViewer = ({ 
  shorts, 
  initialIndex, 
  open, 
  onOpenChange,
  onLoadMore,
  hasMore = false 
}: ShortsViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchDeltaY, setTouchDeltaY] = useState<number>(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const currentShort = shorts[currentIndex];

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Initialize like and comment counts from shorts data
  useEffect(() => {
    const likes: Record<string, number> = {};
    const comments: Record<string, number> = {};
    shorts.forEach(short => {
      likes[short.id] = short.likes_count || 0;
      comments[short.id] = short.comments_count || 0;
    });
    setLikeCounts(likes);
    setCommentCounts(comments);
  }, [shorts]);

  useEffect(() => {
    if (open && videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex]?.play();
    }
    
    return () => {
      videoRefs.current.forEach(video => video?.pause());
    };
  }, [open, currentIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      videoRefs.current[currentIndex]?.pause();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      videoRefs.current[currentIndex]?.pause();
      setCurrentIndex(currentIndex + 1);
      
      // Load more when approaching the end (3 items before)
      if (currentIndex >= shorts.length - 3 && hasMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex]!.muted = !isMuted;
    }
  };

  const toggleLike = async () => {
    const shortId = currentShort.id;
    const wasLiked = isLiked[shortId];
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like shorts",
        variant: "destructive",
      });
      return;
    }
    
    // Optimistic update
    setIsLiked(prev => ({
      ...prev,
      [shortId]: !wasLiked
    }));
    
    setLikeCounts(prev => ({
      ...prev,
      [shortId]: (prev[shortId] || 0) + (wasLiked ? -1 : 1)
    }));

    // Update in database
    try {
      if (wasLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', shortId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: shortId, user_id: user.id });
      }
    } catch (error) {
      // Revert on error
      setIsLiked(prev => ({
        ...prev,
        [shortId]: wasLiked
      }));
      
      setLikeCounts(prev => ({
        ...prev,
        [shortId]: (prev[shortId] || 0) + (wasLiked ? 1 : -1)
      }));
      
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const fetchComments = async (shortId: string) => {
    setIsLoadingComments(true);
    try {
      // Step 1: Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('id, content, created_at, user_id, parent_comment_id, likes_count')
        .eq('post_id', shortId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setIsLoadingComments(false);
        return;
      }

      // Step 2: Get unique user IDs and fetch profiles separately
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Step 3: Fetch comment likes for the current user
      if (user) {
        const commentIds = commentsData.map(c => c.id);
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedComments: Record<string, boolean> = {};
        likesData?.forEach(like => {
          likedComments[like.comment_id] = true;
        });
        setCommentLikes(likedComments);
      }

      // Step 4: Map profiles to comments and organize by parent/child
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      // Separate top-level comments and replies
      const topLevelComments = commentsData.filter(c => !c.parent_comment_id);
      const replies = commentsData.filter(c => c.parent_comment_id);
      
      // Build a map of replies by parent comment ID
      const repliesByParent = new Map<string, any[]>();
      replies.forEach(reply => {
        const parentId = reply.parent_comment_id;
        if (!repliesByParent.has(parentId)) {
          repliesByParent.set(parentId, []);
        }
        repliesByParent.get(parentId)!.push({
          ...reply,
          profiles: profilesMap.get(reply.user_id) || null
        });
      });

      // Attach replies to their parent comments
      const commentsWithProfiles = topLevelComments.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || null,
        replies: repliesByParent.get(comment.id) || []
      }));

      // Initialize like counts
      const likeCounts: Record<string, number> = {};
      commentsData.forEach(c => {
        likeCounts[c.id] = c.likes_count || 0;
      });
      setCommentLikeCounts(likeCounts);

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleComment = () => {
    setShowComments(!showComments);
    setReplyToCommentId(null);
    if (!showComments) {
      fetchComments(currentShort.id);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  const addComment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: currentShort.id,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: replyToCommentId
        });

      if (error) throw error;

      setNewComment("");
      setReplyToCommentId(null);
      fetchComments(currentShort.id);
      
      // Update comment count
      setCommentCounts(prev => ({
        ...prev,
        [currentShort.id]: (prev[currentShort.id] || 0) + 1
      }));

      toast({
        title: replyToCommentId ? "Reply added!" : "Comment added!",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like comments",
        variant: "destructive",
      });
      return;
    }

    const wasLiked = commentLikes[commentId];
    
    // Optimistic update
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: !wasLiked
    }));
    
    setCommentLikeCounts(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (wasLiked ? -1 : 1)
    }));

    try {
      if (wasLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
      }
    } catch (error) {
      // Revert on error
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: wasLiked
      }));
      
      setCommentLikeCounts(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 0) + (wasLiked ? 1 : -1)
      }));
      
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleReply = (commentId: string) => {
    setReplyToCommentId(commentId);
    // Focus the input (will need a ref for this)
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/shorts/${currentShort.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Short link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, shorts.length]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0 && currentIndex < shorts.length - 1) {
      handleNext();
    } else if (e.deltaY < 0 && currentIndex > 0) {
      handlePrevious();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchDeltaY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    setTouchDeltaY(touchStartY - currentY);
  };

  const handleTouchEnd = () => {
    const minSwipeDistance = 50;
    
    if (Math.abs(touchDeltaY) > minSwipeDistance) {
      if (touchDeltaY > 0 && currentIndex < shorts.length - 1) {
        handleNext();
      } else if (touchDeltaY < 0 && currentIndex > 0) {
        handlePrevious();
      }
    }
    
    setTouchStartY(0);
    setTouchDeltaY(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container && open) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [open, currentIndex, shorts.length]);

  if (!currentShort) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-full h-screen w-screen p-0 border-0 bg-black overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Shorts Viewer</DialogTitle>
        </VisuallyHidden>
        {/* Space/Cosmic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.1),transparent_50%)]" />
        
        {/* Animated Stars */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-cyan-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2/3 right-1/4 w-0.5 h-0.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="h-full w-full" style={{ 
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
          }} />
        </div>
        
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button - Compact */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 group"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 rounded-md blur-lg transition-all duration-500" />
              
              <div className="relative w-7 h-7 bg-gradient-to-br from-slate-900 to-slate-950 rounded-md border border-slate-700/50 group-hover:border-cyan-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <X className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-colors relative z-10" />
              </div>
            </div>
          </button>


          {/* Video Container */}
          <div className="relative w-full max-w-[500px] h-full">
            {/* Holographic Frame */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Corner Tech Elements */}
              <div className="absolute top-4 left-4 w-12 h-12">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyan-400/60" />
              </div>
              <div className="absolute top-4 right-4 w-12 h-12">
                <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyan-400/60" />
              </div>
              <div className="absolute bottom-4 left-4 w-12 h-12">
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute bottom-0 left-0 w-px h-full bg-gradient-to-t from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyan-400/60" />
              </div>
              <div className="absolute bottom-4 right-4 w-12 h-12">
                <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-t from-cyan-400 via-blue-500 to-transparent" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-cyan-400/60" />
              </div>
            </div>

            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={currentShort.video_url}
              className="w-full h-full object-contain"
              loop
              playsInline
              autoPlay
              muted={isMuted}
              onError={(e) => {
                console.error('[Shorts] Video load error:', currentShort.video_url);
              }}
            />

            {/* Minimal Vignette - 20% intensity */}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

            {/* Content Overlay - HUD Style */}
            <div className="absolute bottom-0 left-0 right-20 p-4 z-40">
              {/* User Info - Slim Metal Card */}
              <div className="relative mb-3">
                {/* Card Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-xl blur" />
                
                {/* Metal Frame */}
                <div className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700/30 p-2.5 shadow-xl">
                  {/* Metallic Shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-transparent rounded-xl pointer-events-none" />
                  
                  <div className="relative flex items-center gap-2">
                    <div className="relative">
                      {/* Avatar Glow */}
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-full blur opacity-40" />
                      
                      <Avatar 
                        className="relative h-9 w-9 border border-slate-700 cursor-pointer hover:border-cyan-400 transition-all ring-1 ring-cyan-400/10 hover:ring-cyan-400/30"
                        onClick={() => handleUserClick(currentShort.user_id)}
                      >
                        <AvatarImage src={currentShort.profiles?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-400 font-bold text-xs">
                          {currentShort.profiles?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Status Indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-slate-900 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p 
                        className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 font-semibold text-sm cursor-pointer hover:from-cyan-300 hover:via-blue-300 hover:to-cyan-300 transition-all flex items-center gap-1.5 truncate"
                        onClick={() => handleUserClick(currentShort.user_id)}
                      >
                        {currentShort.profiles?.full_name || "User"}
                        <Zap className="h-3 w-3 text-cyan-400 animate-pulse flex-shrink-0" />
                      </p>
                      <p className="text-slate-500 text-[10px] font-mono">
                        {new Date(currentShort.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption - Holographic Text */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-lg blur" />
                <p className="relative text-white text-sm leading-relaxed line-clamp-3 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)] font-light">
                  {currentShort.content}
                </p>
              </div>
            </div>

            {/* Action Buttons - Extra Compact */}
            <div className="absolute right-2 bottom-24 flex flex-col gap-2 z-40">
              {/* Like Button */}
              <button
                onClick={toggleLike}
                className="group relative flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  <div className={cn(
                    "absolute -inset-1 rounded-lg blur-md transition-all duration-500",
                    isLiked[currentShort.id] 
                      ? "bg-gradient-to-br from-rose-500 to-pink-500 opacity-50" 
                      : "bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/30 group-hover:to-blue-500/30"
                  )} />
                  
                  <div className={cn(
                    "relative w-6 h-6 rounded-lg flex items-center justify-center backdrop-blur-xl border transition-all duration-300",
                    isLiked[currentShort.id]
                      ? "bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-400/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-gradient-to-br from-slate-900/80 to-black/80 border-slate-700/40 group-hover:border-cyan-400/40"
                  )}>
                    <Heart
                      className={cn(
                        "h-3.5 w-3.5 transition-all duration-300",
                        isLiked[currentShort.id]
                          ? "fill-rose-500 text-rose-500 scale-110"
                          : "text-slate-400 group-hover:text-cyan-400 group-hover:scale-110"
                      )}
                    />
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-mono font-semibold transition-colors",
                  isLiked[currentShort.id] ? "text-rose-400" : "text-slate-500 group-hover:text-cyan-400"
                )}>
                  {likeCounts[currentShort.id] || 0}
                </span>
              </button>

              {/* Comment Button */}
              <button 
                onClick={handleComment}
                className="group relative flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/30 group-hover:to-green-500/30 rounded-lg blur-md transition-all duration-500" />
                  
                  <div className="relative w-6 h-6 bg-gradient-to-br from-slate-900/80 to-black/80 rounded-lg border border-slate-700/40 group-hover:border-emerald-400/40 backdrop-blur-xl flex items-center justify-center transition-all duration-300">
                    <MessageCircle className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300" />
                  </div>
                </div>
                 <span className="text-slate-500 group-hover:text-emerald-400 text-[9px] font-mono font-semibold transition-colors opacity-60">
                  {commentCounts[currentShort.id] || 0}
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={handleShare}
                className="group relative flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/30 group-hover:to-pink-500/30 rounded-lg blur-md transition-all duration-500" />
                  
                  <div className="relative w-6 h-6 bg-gradient-to-br from-slate-900/80 to-black/80 rounded-lg border border-slate-700/40 group-hover:border-purple-400/40 backdrop-blur-xl flex items-center justify-center transition-all duration-300">
                    <Share2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-300" />
                  </div>
                </div>
              </button>

              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className="group relative flex flex-col items-center gap-0.5"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 rounded-lg blur-md transition-all duration-500" />
                  
                  <div className="relative w-6 h-6 bg-gradient-to-br from-slate-900/80 to-black/80 rounded-lg border border-slate-700/40 group-hover:border-cyan-400/40 backdrop-blur-xl flex items-center justify-center transition-all duration-300">
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Comments Panel - YouTube Style */}
            {showComments && (
              <div className="fixed inset-x-0 bottom-0 max-w-[500px] mx-auto h-[70vh] bg-gradient-to-b from-slate-900/98 to-black/98 backdrop-blur-xl rounded-t-2xl border-t border-x border-slate-700/50 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-slate-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Comments</h3>
                    <span className="text-sm text-slate-400">{commentCounts[currentShort.id] || 0}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(false)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Comments List */}
                <ScrollArea className="h-[calc(100%-10rem)] px-4">
                  {isLoadingComments ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-3" />
                      <p className="text-sm font-medium">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                      <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-sm font-medium">No comments yet</p>
                      <p className="text-xs mt-1 opacity-60">Be the first to comment!</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          {/* Main Comment */}
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-400 text-sm">
                                {comment.profiles?.full_name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-white truncate">
                                  {comment.profiles?.full_name || "User"}
                                </p>
                                <span className="text-xs text-slate-500 flex-shrink-0">
                                  {formatTimeAgo(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-200 leading-relaxed break-words">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <button 
                                  onClick={() => toggleCommentLike(comment.id)}
                                  className={cn(
                                    "flex items-center gap-1 transition-colors group",
                                    commentLikes[comment.id] 
                                      ? "text-red-500" 
                                      : "text-slate-400 hover:text-red-500"
                                  )}
                                >
                                  <Heart 
                                    className={cn(
                                      "h-3.5 w-3.5 group-hover:scale-110 transition-transform",
                                      commentLikes[comment.id] && "fill-current"
                                    )} 
                                  />
                                  <span className="text-xs">
                                    {commentLikeCounts[comment.id] || 0}
                                  </span>
                                </button>
                                <button 
                                  onClick={() => handleReply(comment.id)}
                                  className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-12 space-y-3 pl-4 border-l-2 border-slate-700/30">
                              {comment.replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                                    <AvatarImage src={reply.profiles?.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-400 text-xs">
                                      {reply.profiles?.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-white truncate">
                                        {reply.profiles?.full_name || "User"}
                                      </p>
                                      <span className="text-xs text-slate-500 flex-shrink-0">
                                        {formatTimeAgo(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed break-words">
                                      {reply.content}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <button 
                                        onClick={() => toggleCommentLike(reply.id)}
                                        className={cn(
                                          "flex items-center gap-1 transition-colors group",
                                          commentLikes[reply.id] 
                                            ? "text-red-500" 
                                            : "text-slate-400 hover:text-red-500"
                                        )}
                                      >
                                        <Heart 
                                          className={cn(
                                            "h-3.5 w-3.5 group-hover:scale-110 transition-transform",
                                            commentLikes[reply.id] && "fill-current"
                                          )} 
                                        />
                                        <span className="text-xs">
                                          {commentLikeCounts[reply.id] || 0}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Add Comment Input */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-gradient-to-t from-black/95 to-transparent backdrop-blur-xl">
                  {replyToCommentId && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                      <span>Replying to comment</span>
                      <button 
                        onClick={() => setReplyToCommentId(null)}
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3 items-start">
                    {user && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-400 text-sm">
                          {user.user_metadata?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyToCommentId ? "Add a reply..." : "Add a comment..."}
                        className="flex-1 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-cyan-500/50 rounded-full px-4"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addComment();
                          }
                        }}
                      />
                      <Button
                        onClick={addComment}
                        size="sm"
                        disabled={!newComment.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-40 rounded-full h-10 w-10 p-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Indicator - HUD Style */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40">
              <div className="relative flex gap-3 p-2 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-full border border-slate-700/50 shadow-2xl">
                {/* Metallic Shine */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full pointer-events-none" />
                
                {shorts.map((_, index) => (
                  <div
                    key={index}
                    className="relative"
                  >
                    {index === currentIndex && (
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-sm" />
                    )}
                    <div
                      className={cn(
                        "relative rounded-full transition-all duration-500",
                        index === currentIndex
                          ? "w-12 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                          : "w-2 h-1.5 bg-slate-700"
                      )}
                    >
                      {index === currentIndex && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent rounded-full" />
                          <div className="absolute top-0 left-0 right-1/2 h-full bg-gradient-to-r from-white/30 to-transparent rounded-full animate-pulse" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Dialog */}
        <UserProfileDialog
          userId={selectedUserId}
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShortsViewer;
