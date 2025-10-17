import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play } from "lucide-react";
import ShortsViewer from "./ShortsViewer";

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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchShorts();
    
    // Set up real-time subscription for new shorts
    const channel = supabase
      .channel('shorts-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        () => {
          console.log('New post detected, refreshing shorts');
          fetchShorts();
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'feed_posts' },
        () => {
          console.log('Post updated, refreshing shorts');
          fetchShorts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShorts = async () => {
    try {
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

      if (error) {
        console.error('Error fetching shorts:', error);
        return;
      }

      if (postsData) {
        const videoShorts = postsData
          .filter(post => {
            if (!post.media_urls || !Array.isArray(post.media_urls) || post.media_urls.length === 0) return false;
            
            // Check if any media URL is a video
            return post.media_urls.some(url => {
              if (!url || typeof url !== 'string') return false;
              const lowerUrl = url.toLowerCase();
              return lowerUrl.includes('.mp4') || 
                     lowerUrl.includes('.webm') || 
                     lowerUrl.includes('.mov') || 
                     lowerUrl.includes('video/') ||
                     lowerUrl.includes('feed-media'); // Supabase storage bucket
            });
          })
          .map(post => {
            // Find the first video URL
            const videoUrl = post.media_urls!.find(url => {
              if (!url || typeof url !== 'string') return false;
              const lowerUrl = url.toLowerCase();
              return lowerUrl.includes('.mp4') || 
                     lowerUrl.includes('.webm') || 
                     lowerUrl.includes('.mov') || 
                     lowerUrl.includes('video/') ||
                     lowerUrl.includes('feed-media');
            });

            return {
              id: post.id,
              video_url: videoUrl || post.media_urls![0],
              content: post.content,
              user_id: post.user_id,
              profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              created_at: post.created_at
            };
          });

        console.log('Fetched shorts:', videoShorts.length);
        setShorts(videoShorts);
      }
    } catch (error) {
      console.error('Error in fetchShorts:', error);
    }
  };

  const openViewer = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  // Don't render if no shorts and user hasn't created any yet
  if (shorts.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shorts</h2>
        </div>

        <div 
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Create Short Card - Always show */}
          <Card
            className="flex-shrink-0 w-[120px] h-[180px] cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-dashed border-primary/30"
            onClick={onCreateShort}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-3 gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold">Create</h3>
                <p className="text-xs text-muted-foreground">Short</p>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder message */}
          <div className="flex items-center justify-center text-muted-foreground text-sm px-4">
            No shorts yet. Create your first one!
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shorts</h2>
          <span className="text-sm text-muted-foreground">{shorts.length} shorts</span>
        </div>

        <div 
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Create Short Card */}
          <Card
            className="flex-shrink-0 w-[120px] h-[180px] cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 border-dashed border-primary/30"
            onClick={onCreateShort}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-3 gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold">Create</h3>
                <p className="text-xs text-muted-foreground">Short</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Existing Shorts */}
          {shorts.map((short, index) => (
            <Card 
              key={short.id} 
              className="flex-shrink-0 w-[120px] h-[180px] overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
              onClick={() => openViewer(index)}
            >
              <CardContent className="p-0 h-full relative">
                <video
                  src={short.video_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <p className="text-white text-xs line-clamp-2 font-medium">
                    {short.content}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-5 h-5 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-[10px] text-white font-semibold">
                        {short.profiles?.full_name?.[0] || "U"}
                      </span>
                    </div>
                    <span className="text-white/80 text-[10px] truncate">
                      {short.profiles?.full_name || "User"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ShortsViewer
        shorts={shorts}
        initialIndex={selectedIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </>
  );
};

export default ShortsCarousel;
