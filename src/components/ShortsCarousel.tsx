import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Short {
  id: string;
  video_url: string;
  title: string;
  tags: string[];
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface ShortsCarouselProps {
  onCreateShort: () => void;
}

const ShortsCarousel = ({ onCreateShort }: ShortsCarouselProps) => {
  const [currentShort, setCurrentShort] = useState(0);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sample data - will be replaced with real data
  const shorts: Short[] = [
    {
      id: "1",
      video_url: "/api/placeholder/video1.mp4",
      title: "Startup Journey Day 1",
      tags: ["startup", "journey", "tech"],
      user: {
        id: "1",
        full_name: "John Doe",
        avatar_url: "/api/placeholder/150/150",
        role: "startup"
      },
      likes_count: 24,
      comments_count: 8,
      created_at: "2024-01-01T00:00:00Z"
    },
    {
      id: "2", 
      video_url: "/api/placeholder/video2.mp4",
      title: "Pitch Practice Session",
      tags: ["pitch", "practice", "entrepreneur"],
      user: {
        id: "2",
        full_name: "Jane Smith",
        avatar_url: "/api/placeholder/150/150",
        role: "mentor"
      },
      likes_count: 45,
      comments_count: 12,
      created_at: "2024-01-02T00:00:00Z"
    }
  ];

  const togglePlay = (shortId: string) => {
    setIsPlaying(prev => ({
      ...prev,
      [shortId]: !prev[shortId]
    }));
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'startup': return 'bg-blue-100 text-blue-800';
      case 'investor': return 'bg-green-100 text-green-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Shorts</h2>
        <div className="flex items-center gap-2">
          <Button onClick={onCreateShort} size="sm" className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" />
            Create Short
          </Button>
          <Button variant="ghost" size="sm" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {shorts.map((short) => (
          <Card key={short.id} className="flex-shrink-0 w-64 h-80 relative overflow-hidden group hover:shadow-lg transition-shadow">
            <CardContent className="p-0 h-full relative">
              {/* Video Placeholder */}
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20" />
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => togglePlay(short.id)}
                  className="text-white hover:bg-white/20 z-10"
                >
                  {isPlaying[short.id] ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8" />
                  )}
                </Button>
                
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* User Info - Top */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={short.user.avatar_url} />
                    <AvatarFallback>{short.user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">{short.user.full_name}</p>
                    <Badge className={cn("text-xs", getRoleColor(short.user.role))}>
                      {short.user.role}
                    </Badge>
                  </div>
                </div>

                {/* More Options - Top Right */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {/* Title and Tags - Bottom */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">{short.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {short.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white border-white/30 hover:bg-white/30">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1">
                      <Heart className="h-4 w-4 mr-1" />
                      <span className="text-xs">{short.likes_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">{short.comments_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Short Card */}
        <Card 
          className="flex-shrink-0 w-64 h-80 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer group"
          onClick={onCreateShort}
        >
          <CardContent className="p-0 h-full flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
            <Plus className="h-12 w-12 mb-4" />
            <h3 className="font-semibold mb-2">Create Short</h3>
            <p className="text-sm text-center px-4">Share your startup journey in a short video</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShortsCarousel;