import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play, Loader2, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import ShortsViewer from "./ShortsViewer";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";

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
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

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

  // Reusable Create tile — bigger, more inviting, animated ring
  const CreateTile = (
    <Card
      className="group relative flex-shrink-0 w-[160px] h-[240px] cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 tech-card transition-transform duration-300 hover:-translate-y-1"
      onClick={onCreateShort}
    >
      {/* Animated dashed ring */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-dashed border-primary/40 group-hover:border-primary transition-colors" />
      {/* Soft pulse halo */}
      <div className="pointer-events-none absolute -inset-1 rounded-[inherit] bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="relative z-10 h-full flex flex-col items-center justify-center p-4 gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_-5px_hsl(var(--primary))]">
            <Plus className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-foreground tracking-tight">Create</h3>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">New short</p>
        </div>
      </CardContent>
    </Card>
  );

  // Don't render if no shorts and user hasn't created any yet
  if (shorts.length === 0 && !isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Shorts</h2>
            <p className="text-[11px] text-muted-foreground">Be the first to drop a vibe</p>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 touch-pan-y">
            {CreateTile}
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
          <h2 className="text-lg font-bold text-foreground tracking-tight">Shorts</h2>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 touch-pan-y">
            {CreateTile}
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="flex-shrink-0 w-[160px] h-[240px] overflow-hidden tech-card border-0">
                <CardContent className="h-full p-0 bg-gradient-to-br from-muted via-muted/60 to-muted animate-pulse" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 mt-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Shorts</h2>
            <p className="text-[11px] text-muted-foreground">
              {shorts.length}{hasMore ? '+' : ''} fresh drops · tap to play
            </p>
          </div>
          <div className="hidden sm:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted backdrop-blur-sm border border-border/40"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted backdrop-blur-sm border border-border/40"
              onClick={scrollNext}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 touch-pan-y py-1">
            {CreateTile}

            {/* Existing Shorts — cinematic 9:16 tiles with hover autoplay */}
            {shorts.map((short, index) => (
              <Card
                key={short.id}
                className="group relative flex-shrink-0 w-[160px] h-[240px] overflow-hidden cursor-pointer border-0 tech-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.4)]"
                onClick={() => openViewer(index)}
                onMouseEnter={(e) => {
                  const v = e.currentTarget.querySelector('video');
                  if (v) v.play().catch(() => {});
                }}
                onMouseLeave={(e) => {
                  const v = e.currentTarget.querySelector('video');
                  if (v) { v.pause(); v.currentTime = 0; }
                }}
              >
                {/* Animated gradient border on hover */}
                <div className="pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px" />

                <CardContent className="p-0 h-full relative">
                  <video
                    src={short.video_url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    muted
                    playsInline
                    loop
                    preload="metadata"
                  />

                  {/* Top sheen */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent opacity-60" />
                  {/* Bottom gradient for legibility */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* Floating stats chip */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                    <Heart className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
                    <span className="text-[10px] font-semibold text-white tabular-nums">{short.likes_count}</span>
                  </div>

                  {/* Center play pulse on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/60 blur-xl animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-2xl">
                        <Play className="h-5 w-5 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Caption + author */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                            <span className="text-[10px] text-foreground font-bold">
                              {short.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-white text-[11px] font-medium truncate drop-shadow-md">
                        {short.profiles?.full_name || "User"}
                      </span>
                    </div>
                    <p className="text-white text-[11px] leading-tight line-clamp-2 font-medium drop-shadow-md">
                      {short.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="flex-shrink-0 w-[160px] h-[240px] flex items-center justify-center">
                {loadingMore && (
                  <Card className="flex-shrink-0 w-[160px] h-[240px] tech-card border-0">
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
