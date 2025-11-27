import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play, Loader2 } from "lucide-react";
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
  newShort?: Short | null;
}

const ShortsCarousel = ({ onCreateShort, newShort }: ShortsCarouselProps) => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShorts();
    
    // Set up real-time subscription for shorts only
    const channel = supabase
      .channel('shorts-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'feed_posts',
          filter: 'post_type=eq.short'
        },
        () => {
          console.log('Shorts updated, refreshing');
          setOffset(0);
          fetchShorts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreShorts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore]);

  // Handle new short from parent immediately
  useEffect(() => {
    if (newShort) {
      console.log('[Shorts] New short received, prepending to list');
      setShorts(prev => {
        // Check if this short already exists to avoid duplicates
        const exists = prev.some(s => s.id === newShort.id);
        if (exists) return prev;
        return [newShort, ...prev];
      });
    }
  }, [newShort]);

  const fetchShorts = async (isLoadingMore = false) => {
    try {
      if (!isLoadingMore) {
        setIsLoading(true);
      }
      const currentOffset = isLoadingMore ? offset : 0;
      console.log(`[Shorts] Fetching shorts... offset: ${currentOffset}, isLoadingMore: ${isLoadingMore}`);
      
      // Fetch posts without profiles join
      const { data: postsData, error } = await supabase
        .from('feed_posts')
        .select('id, content, user_id, media_urls, likes_count, comments_count, created_at')
        .eq('post_type', 'short')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + 19);

      if (error) {
        console.error('[Shorts] Error fetching shorts:', error);
        return;
      }

      console.log('[Shorts] Shorts fetched:', postsData?.length || 0);

      if (postsData && postsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        
        // Fetch profiles separately
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        // Create a map of user_id to profile
        const profilesMap = new Map(
          profilesData?.map(profile => [profile.user_id, profile]) || []
        );

        const videoShorts = postsData
          .filter(post => {
            const hasUrl = post.media_urls && Array.isArray(post.media_urls) && post.media_urls.length > 0;
            if (!hasUrl) {
              console.log('[Shorts] Filtered out - no media URL:', post.id);
            }
            return hasUrl;
          })
          .map(post => {
            // Use first media_urls entry
            const videoUrl = Array.isArray(post.media_urls) && post.media_urls.length > 0 ? post.media_urls[0] : '';

            return {
              id: post.id,
              video_url: videoUrl,
              content: post.content,
              user_id: post.user_id,
              profiles: profilesMap.get(post.user_id),
              likes_count: post.likes_count || 0,
              comments_count: post.comments_count || 0,
              created_at: post.created_at
            };
          });

        console.log('[Shorts] Processed shorts count:', videoShorts.length);
        
        if (isLoadingMore) {
          setShorts(prev => [...prev, ...videoShorts]);
        } else {
          setShorts(videoShorts);
        }

        // Check if there are more shorts to load
        setHasMore(videoShorts.length === 20);
        if (isLoadingMore) {
          setOffset(prev => prev + 20);
        } else {
          setOffset(20);
        }
      } else {
        if (!isLoadingMore) {
          setShorts([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('[Shorts] Error in fetchShorts:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreShorts = () => {
    if (!loadingMore && hasMore) {
      console.log('[Shorts] Loading more shorts...');
      setLoadingMore(true);
      fetchShorts(true);
    }
  };

  const openViewer = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  // Don't render if no shorts and user hasn't created any yet
  if (shorts.length === 0 && !isLoading) {
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

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shorts</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4">
          <Card className="flex-shrink-0 w-[120px] h-[180px] border-2 border-dashed border-primary/30">
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
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex-shrink-0 w-[120px] h-[180px] animate-pulse">
              <CardContent className="h-full p-0 bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shorts</h2>
          <span className="text-sm text-muted-foreground">
            {shorts.length}{hasMore ? '+' : ''} shorts
          </span>
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

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerTarget} className="flex-shrink-0 w-[120px] h-[180px] flex items-center justify-center">
              {loadingMore && (
                <Card className="flex-shrink-0 w-[120px] h-[180px]">
                  <CardContent className="h-full flex flex-col items-center justify-center p-3 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <ShortsViewer
        shorts={shorts}
        initialIndex={selectedIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onLoadMore={loadMoreShorts}
        hasMore={hasMore}
      />
    </>
  );
};

export default ShortsCarousel;
