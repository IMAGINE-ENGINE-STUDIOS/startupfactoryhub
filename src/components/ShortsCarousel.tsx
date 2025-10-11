import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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

interface ShortsCarouselProps {
  onCreateShort: () => void;
}

const ShortsCarousel = ({ onCreateShort }: ShortsCarouselProps) => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    const { data: postsData, error } = await supabase
      .from('feed_posts')
      .select(`
        id,
        content,
        user_id,
        media_urls,
        likes_count,
        comments_count,
        created_at,
        profiles:user_id(full_name, avatar_url)
      `)
      .not('media_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && postsData) {
      // Filter for video posts (shorts)
      const videoShorts = postsData
        .filter(post => {
          if (!post.media_urls || !Array.isArray(post.media_urls)) return false;
          return post.media_urls.some(url => 
            url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('video'))
          );
        })
        .map(post => ({
          id: post.id,
          video_url: post.media_urls![0],
          content: post.content,
          user_id: post.user_id,
          profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          created_at: post.created_at
        }));

      setShorts(videoShorts);
    }
  };

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
              <div className="w-full h-full relative">
                <video 
                  src={short.video_url} 
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-black/20" />
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => togglePlay(short.id)}
                  className="absolute inset-0 flex items-center justify-center text-white hover:bg-white/20 z-10"
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
                <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={short.profiles?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {short.profiles?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">{short.profiles?.full_name || 'User'}</p>
                  </div>
                </div>

                {/* Content - Bottom */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <p className="text-white text-sm mb-3 line-clamp-2">{short.content}</p>
                  
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