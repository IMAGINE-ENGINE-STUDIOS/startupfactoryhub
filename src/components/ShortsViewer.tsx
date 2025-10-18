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
          {/* Close Button - Hexagonal Tech */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 right-8 z-50 group"
          >
            <div className="relative">
              {/* Outer Glow Ring */}
              <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 rounded-lg blur-xl transition-all duration-500" />
              
              {/* Metal Frame */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-tl from-white/5 via-transparent to-white/10 rounded-lg" />
                
                {/* Main Button */}
                <div className="relative w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700/50 group-hover:border-cyan-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  {/* Inner Corner Accents */}
                  <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-cyan-400/0 group-hover:border-cyan-400/60 transition-all duration-300" />
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-cyan-400/0 group-hover:border-cyan-400/60 transition-all duration-300" />
                  <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-cyan-400/0 group-hover:border-cyan-400/60 transition-all duration-300" />
                  <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-cyan-400/0 group-hover:border-cyan-400/60 transition-all duration-300" />
                  
                  <X className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors relative z-10" />
                </div>
              </div>
            </div>
          </button>

          {/* Navigation - Vertical Tech Bars */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-8 top-1/2 -translate-y-1/2 z-50 group"
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-b from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/40 group-hover:to-blue-500/40 blur-2xl transition-all duration-500" />
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl" />
                  
                  <div className="relative w-12 h-16 bg-gradient-to-b from-slate-900 to-black rounded-xl border border-slate-700/50 group-hover:border-cyan-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.1)]">
                    {/* Tech Lines */}
                    <div className="absolute left-1 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute right-1 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <ChevronUp className="h-7 w-7 text-slate-400 group-hover:text-cyan-400 transition-colors relative z-10" />
                  </div>
                </div>
              </div>
            </button>
          )}
          
          {currentIndex < shorts.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute left-8 bottom-36 z-50 group"
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-t from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/40 group-hover:to-blue-500/40 blur-2xl transition-all duration-500" />
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-slate-900 rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl" />
                  
                  <div className="relative w-12 h-16 bg-gradient-to-t from-slate-900 to-black rounded-xl border border-slate-700/50 group-hover:border-cyan-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_-2px_0_0_rgba(255,255,255,0.1)]">
                    <div className="absolute left-1 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute right-1 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <ChevronDown className="h-7 w-7 text-slate-400 group-hover:text-cyan-400 transition-colors relative z-10" />
                  </div>
                </div>
              </div>
            </button>
          )}

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

            {/* Advanced Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

            {/* Content Overlay - HUD Style */}
            <div className="absolute bottom-0 left-0 right-24 p-6 z-40">
              {/* User Info - Metal Card */}
              <div className="relative mb-4">
                {/* Card Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur" />
                
                {/* Metal Frame */}
                <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 shadow-2xl">
                  {/* Metallic Shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none" />
                  
                  {/* Tech Corner Accents */}
                  <div className="absolute top-1 left-1 w-4 h-4 border-t border-l border-cyan-400/30" />
                  <div className="absolute top-1 right-1 w-4 h-4 border-t border-r border-cyan-400/30" />
                  
                  <div className="relative flex items-center gap-3">
                    <div className="relative">
                      {/* Avatar Glow */}
                      <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-full blur-md opacity-60" />
                      
                      {/* Hexagonal Frame */}
                      <div className="relative">
                        <Avatar 
                          className="relative h-14 w-14 border-2 border-slate-700 cursor-pointer hover:border-cyan-400 transition-all ring-2 ring-cyan-400/20 hover:ring-cyan-400/50"
                          onClick={() => handleUserClick(currentShort.user_id)}
                        >
                          <AvatarImage src={currentShort.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-cyan-400 font-bold">
                            {currentShort.profiles?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Status Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p 
                        className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 font-bold text-base cursor-pointer hover:from-cyan-300 hover:via-blue-300 hover:to-cyan-300 transition-all flex items-center gap-2"
                        onClick={() => handleUserClick(currentShort.user_id)}
                      >
                        {currentShort.profiles?.full_name || "User"}
                        <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
                      </p>
                      <p className="text-slate-400 text-xs font-mono">
                        {new Date(currentShort.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Tech Detail Line */}
                    <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/50 to-transparent" />
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

            {/* Action Buttons - Octagonal Tech Design */}
            <div className="absolute right-6 bottom-36 flex flex-col gap-5 z-40">
              {/* Like Button */}
              <button
                onClick={toggleLike}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  {/* Outer Glow */}
                  <div className={cn(
                    "absolute -inset-3 rounded-2xl blur-xl transition-all duration-500",
                    isLiked[currentShort.id] 
                      ? "bg-gradient-to-br from-rose-500 to-pink-500 opacity-70" 
                      : "bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/50 group-hover:to-blue-500/50"
                  )} />
                  
                  {/* Metal Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-white/10 rounded-2xl" />
                    
                    <div className={cn(
                      "relative w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.1)]",
                      isLiked[currentShort.id]
                        ? "bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-400/50 shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                        : "bg-gradient-to-br from-slate-900 to-black border-slate-700/50 group-hover:border-cyan-400/50"
                    )}>
                      {/* Tech Corner Details */}
                      <div className={cn(
                        "absolute top-1 left-1 w-3 h-3 border-t border-l transition-all duration-300",
                        isLiked[currentShort.id] ? "border-rose-400/60" : "border-cyan-400/0 group-hover:border-cyan-400/60"
                      )} />
                      <div className={cn(
                        "absolute bottom-1 right-1 w-3 h-3 border-b border-r transition-all duration-300",
                        isLiked[currentShort.id] ? "border-rose-400/60" : "border-cyan-400/0 group-hover:border-cyan-400/60"
                      )} />
                      
                      <Heart
                        className={cn(
                          "h-7 w-7 transition-all duration-300 relative z-10",
                          isLiked[currentShort.id]
                            ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                            : "text-slate-400 group-hover:text-cyan-400 group-hover:scale-110"
                        )}
                      />
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-mono font-bold transition-colors",
                  isLiked[currentShort.id] ? "text-rose-400" : "text-slate-400 group-hover:text-cyan-400"
                )}>
                  {likeCounts[currentShort.id] || 0}
                </span>
              </button>

              {/* Comment Button */}
              <button 
                onClick={handleComment}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-emerald-500/0 to-green-500/0 group-hover:from-emerald-500/50 group-hover:to-green-500/50 rounded-2xl blur-xl transition-all duration-500" />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-white/10 rounded-2xl" />
                    
                    <div className="relative w-16 h-16 bg-gradient-to-br from-slate-900 to-black rounded-2xl border border-slate-700/50 group-hover:border-emerald-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.1)]">
                      <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-emerald-400/0 group-hover:border-emerald-400/60 transition-all duration-300" />
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-emerald-400/0 group-hover:border-emerald-400/60 transition-all duration-300" />
                      
                      <MessageCircle className="h-7 w-7 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-400 text-xs font-mono font-bold transition-colors">
                  {currentShort.comments_count}
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={handleShare}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/50 group-hover:to-pink-500/50 rounded-2xl blur-xl transition-all duration-500" />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-white/10 rounded-2xl" />
                    
                    <div className="relative w-16 h-16 bg-gradient-to-br from-slate-900 to-black rounded-2xl border border-slate-700/50 group-hover:border-purple-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.1)]">
                      <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-purple-400/0 group-hover:border-purple-400/60 transition-all duration-300" />
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-purple-400/0 group-hover:border-purple-400/60 transition-all duration-300" />
                      
                      <Share2 className="h-7 w-7 text-slate-400 group-hover:text-purple-400 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-purple-400 text-xs font-mono font-bold transition-colors">Share</span>
              </button>

              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className="group relative flex flex-col items-center gap-2"
              >
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/50 group-hover:to-blue-500/50 rounded-2xl blur-xl transition-all duration-500" />
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-white/10 rounded-2xl" />
                    
                    <div className="relative w-16 h-16 bg-gradient-to-br from-slate-900 to-black rounded-2xl border border-slate-700/50 group-hover:border-cyan-400/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.1)]">
                      <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-cyan-400/0 group-hover:border-cyan-400/60 transition-all duration-300" />
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-cyan-400/0 group-hover:border-cyan-400/60 transition-all duration-300" />
                      
                      {isMuted ? (
                        <VolumeX className="h-7 w-7 text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 relative z-10" />
                      ) : (
                        <Volume2 className="h-7 w-7 text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 relative z-10" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>

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
