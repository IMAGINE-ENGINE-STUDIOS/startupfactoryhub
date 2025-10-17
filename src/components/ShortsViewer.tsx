import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserProfileDialog from "@/components/UserProfileDialog";
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentShort = shorts[currentIndex];

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

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

  const toggleLike = () => {
    setIsLiked(prev => ({
      ...prev,
      [currentShort.id]: !prev[currentShort.id]
    }));
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
        className="max-w-full h-screen w-screen p-0 border-0 bg-black"
        ref={containerRef}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute top-1/2 left-4 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronUp className="h-8 w-8" />
            </Button>
          )}
          
          {currentIndex < shorts.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute top-1/2 right-4 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full"
            >
              <ChevronDown className="h-8 w-8" />
            </Button>
          )}

          {/* Video Container */}
          <div className="relative w-full max-w-[500px] h-full">
            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={currentShort.video_url}
              className="w-full h-full object-contain"
              loop
              playsInline
              autoPlay
              muted={isMuted}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-40">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar 
                  className="h-12 w-12 border-2 border-white/20 cursor-pointer hover:ring-2 ring-white/50 transition-all"
                  onClick={() => handleUserClick(currentShort.user_id)}
                >
                  <AvatarImage src={currentShort.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {currentShort.profiles?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p 
                    className="text-white font-semibold text-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleUserClick(currentShort.user_id)}
                  >
                    {currentShort.profiles?.full_name || "User"}
                  </p>
                  <p className="text-white/70 text-sm">
                    {new Date(currentShort.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Caption */}
              <p className="text-white text-base mb-4 line-clamp-3">
                {currentShort.content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-40">
              <button
                onClick={toggleLike}
                className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm",
                  isLiked[currentShort.id] 
                    ? "bg-red-500/20" 
                    : "bg-white/20"
                )}>
                  <Heart
                    className={cn(
                      "h-7 w-7",
                      isLiked[currentShort.id]
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-sm font-semibold">
                  {currentShort.likes_count + (isLiked[currentShort.id] ? 1 : 0)}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1 transition-transform hover:scale-110">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">
                  {currentShort.comments_count}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1 transition-transform hover:scale-110">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">Share</span>
              </button>

              <button
                onClick={toggleMute}
                className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {isMuted ? (
                    <VolumeX className="h-7 w-7 text-white" />
                  ) : (
                    <Volume2 className="h-7 w-7 text-white" />
                  )}
                </div>
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-40">
              {shorts.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    index === currentIndex
                      ? "w-8 bg-white"
                      : "w-1 bg-white/40"
                  )}
                />
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
