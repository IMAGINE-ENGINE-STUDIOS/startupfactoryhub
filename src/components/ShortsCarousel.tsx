import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Pause, 
  Plus
} from "lucide-react";

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

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Shorts</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .overflow-x-auto::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Create Short Card - Square format */}
        <Card
          className="flex-shrink-0 w-[150px] h-[150px] cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onCreateShort}
        >
          <CardContent className="h-full flex flex-col items-center justify-center p-4 gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold">Create</h3>
              <p className="text-xs text-muted-foreground">Short</p>
            </div>
          </CardContent>
        </Card>
        
        {shorts.map((short) => (
          <Card key={short.id} className="flex-shrink-0 w-[150px] h-[150px] overflow-hidden">
            <CardContent className="p-0 h-full relative group/card">
              <video
                src={short.video_url}
                className="w-full h-full object-cover"
                loop
                muted
                playsInline
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (isPlaying[short.id]) {
                    video.pause();
                  } else {
                    video.play();
                  }
                  togglePlay(short.id);
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 z-20">
                <p className="text-white text-xs line-clamp-2">{short.content}</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePlay(short.id)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10"
              >
                {isPlaying[short.id] ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShortsCarousel;
