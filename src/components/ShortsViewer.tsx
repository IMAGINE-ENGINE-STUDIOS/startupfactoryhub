import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserProfileDialog from "@/components/UserProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Zap
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
}

const ShortsViewer = ({ shorts, initialIndex, open, onOpenChange }: ShortsViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentShort = shorts[currentIndex];

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Initialize like counts from shorts data
  useEffect(() => {
    const counts: Record<string, number> = {};
    shorts.forEach(short => {
      counts[short.id] = short.likes_count || 0;
    });
    setLikeCounts(counts);
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

  const handleComment = () => {
    toast({
      title: "Comments",
      description: "Comment feature coming soon!",
    });
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
        className="max-w-full h-screen w-screen p-0 border-0 bg-black overflow-hidden"
        ref={containerRef}
      >
        {/* Electric Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
        
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button - Futuristic */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:border-blue-400/50 transition-all">
                <X className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
              </div>
            </div>
          </button>

          {/* Navigation Arrows - Futuristic */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-50 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:border-cyan-400/50 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all">
                  <ChevronUp className="h-7 w-7 text-white/80 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </button>
          )}
          
          {currentIndex < shorts.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute left-6 bottom-32 z-50 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-14 h-14 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:border-cyan-400/50 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all">
                  <ChevronDown className="h-7 w-7 text-white/80 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </button>
          )}

          {/* Video Container */}
          <div className="relative w-full max-w-[500px] h-full">
            {/* Neon Frame */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 border-2 border-blue-500/0 rounded-lg group-hover:border-blue-500/20 transition-all" 
                   style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)' }} />
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

            {/* Advanced Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-20 p-6 z-40">
              {/* User Info - Glassmorphic */}
              <div className="flex items-center gap-3 mb-4 backdrop-blur-sm bg-white/5 rounded-2xl p-3 border border-white/10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-50" />
                  <Avatar 
                    className="relative h-12 w-12 border-2 border-white/20 cursor-pointer hover:border-cyan-400/50 transition-all ring-2 ring-white/5"
                    onClick={() => handleUserClick(currentShort.user_id)}
                  >
                    <AvatarImage src={currentShort.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                      {currentShort.profiles?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p 
                    className="text-white font-semibold text-base cursor-pointer hover:text-cyan-400 transition-colors flex items-center gap-2"
                    onClick={() => handleUserClick(currentShort.user_id)}
                  >
                    {currentShort.profiles?.full_name || "User"}
                    <Zap className="h-3 w-3 text-cyan-400" />
                  </p>
                  <p className="text-white/60 text-xs">
                    {new Date(currentShort.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Caption */}
              <p className="text-white text-sm leading-relaxed mb-4 line-clamp-3 drop-shadow-lg">
                {currentShort.content}
              </p>
            </div>

            {/* Action Buttons - Futuristic Design */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-4 z-40">
              <button
                onClick={toggleLike}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-xl transition-opacity",
                    isLiked[currentShort.id] 
                      ? "bg-gradient-to-br from-red-500 to-pink-500 opacity-60" 
                      : "bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-50"
                  )} />
                  <div className={cn(
                    "relative w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all",
                    isLiked[currentShort.id]
                      ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-400/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                      : "bg-black/40 border-white/10 group-hover:border-blue-400/30 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  )}>
                    <Heart
                      className={cn(
                        "h-6 w-6 transition-all",
                        isLiked[currentShort.id]
                          ? "fill-red-500 text-red-500 scale-110"
                          : "text-white/90 group-hover:text-blue-400"
                      )}
                    />
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-bold transition-colors",
                  isLiked[currentShort.id] ? "text-red-400" : "text-white/80"
                )}>
                  {likeCounts[currentShort.id] || 0}
                </span>
              </button>

              <button 
                onClick={handleComment}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:border-green-400/30 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all">
                    <MessageCircle className="h-6 w-6 text-white/90 group-hover:text-green-400 transition-colors" />
                  </div>
                </div>
                <span className="text-white/80 text-xs font-bold">
                  {currentShort.comments_count}
                </span>
              </button>

              <button 
                onClick={handleShare}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:border-purple-400/30 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all">
                    <Share2 className="h-6 w-6 text-white/90 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
                <span className="text-white/80 text-xs font-bold">Share</span>
              </button>

              <button
                onClick={toggleMute}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:border-cyan-400/30 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
                    {isMuted ? (
                      <VolumeX className="h-6 w-6 text-white/90 group-hover:text-cyan-400 transition-colors" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-white/90 group-hover:text-cyan-400 transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Progress Indicator - Lightning Style */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-40">
              {shorts.map((_, index) => (
                <div
                  key={index}
                  className="relative"
                >
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-cyan-400 blur-sm rounded-full" />
                  )}
                  <div
                    className={cn(
                      "relative h-1 rounded-full transition-all duration-300",
                      index === currentIndex
                        ? "w-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        : "w-1.5 bg-white/20"
                    )}
                  />
                </div>
              ))}
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
