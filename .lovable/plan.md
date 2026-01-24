

# Enhance Booking Modal with Image Carousel & Video Support

## Summary
Add the same image carousel functionality from `HubsDetailPanel` to `HubsBookingModal`, along with support for workspace tour videos. This gives users a rich media experience before confirming their booking.

---

## Changes Required

### 1. Update Workspace Interface for Video Support

**File: `src/hooks/useHubsSearch.ts`**

Add `videos` array to the Workspace interface:
```typescript
export interface Workspace {
  // ... existing fields
  images?: string[];
  videos?: string[];  // NEW: Array of workspace video URLs
  // ...
}
```

### 2. Update Mock Data with Videos

**File: `supabase/functions/hub-search-workspaces/index.ts`**

Add video URLs (using stock office tour videos from Pexels/Coverr):
```typescript
{
  id: "ws-sf-wework-1",
  // ... existing fields
  images: [...],
  videos: [
    "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4"
  ],
}
```

### 3. Enhance Booking Modal with Carousel

**File: `src/components/hubs/HubsBookingModal.tsx`**

#### A. Make Modal Wider for Better Media Display
Change from `sm:max-w-lg` to `sm:max-w-2xl`:
```tsx
<DialogContent className="sm:max-w-2xl tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20">
```

#### B. Add Carousel Imports & State
```tsx
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi 
} from '@/components/ui/carousel';
import { useMemo, useEffect } from 'react';
import { Play, Image as ImageIcon } from 'lucide-react';

// State for carousel
const [carouselApi, setCarouselApi] = useState<CarouselApi>();
const [currentSlide, setCurrentSlide] = useState(0);
const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

// Combine all media
const allImages = useMemo(() => {
  const imgs: string[] = [];
  if (workspace?.images?.length) {
    imgs.push(...workspace.images);
  } else if (workspace?.image_url) {
    imgs.push(workspace.image_url);
  }
  return imgs;
}, [workspace]);

const allVideos = useMemo(() => workspace?.videos || [], [workspace]);
```

#### C. Replace Static Image with Media Carousel
Replace the current 20x20 image with a larger carousel section:
```tsx
{/* Media Carousel Section */}
<div className="relative h-48 rounded-2xl overflow-hidden border border-white/30">
  {mediaType === 'image' && allImages.length > 0 ? (
    <Carousel 
      className="w-full h-full" 
      setApi={setCarouselApi}
      opts={{ loop: true }}
    >
      <CarouselContent className="-ml-0">
        {allImages.map((imageUrl, index) => (
          <CarouselItem key={index} className="pl-0">
            <img
              src={imageUrl}
              alt={`${workspace.name} - Image ${index + 1}`}
              className="w-full h-48 object-cover"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      
      {allImages.length > 1 && (
        <>
          <CarouselPrevious className="left-3 h-8 w-8 backdrop-blur-xl bg-black/30 border-0 text-white hover:bg-black/50" />
          <CarouselNext className="right-3 h-8 w-8 backdrop-blur-xl bg-black/30 border-0 text-white hover:bg-black/50" />
        </>
      )}
      
      {allImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full backdrop-blur-xl bg-black/40 text-white text-xs font-medium">
          {currentSlide + 1} / {allImages.length}
        </div>
      )}
    </Carousel>
  ) : mediaType === 'video' && allVideos.length > 0 ? (
    <video
      src={allVideos[0]}
      controls
      className="w-full h-48 object-cover"
      poster={allImages[0]}
    >
      Your browser does not support video playback.
    </video>
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
      <Building2 className="h-16 w-16 text-primary/50" />
    </div>
  )}
</div>

{/* Media Type Toggle (if videos available) */}
{allVideos.length > 0 && (
  <div className="flex gap-2">
    <Button
      variant={mediaType === 'image' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setMediaType('image')}
      className="flex-1 gap-2"
    >
      <ImageIcon className="h-4 w-4" />
      Photos ({allImages.length})
    </Button>
    <Button
      variant={mediaType === 'video' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setMediaType('video')}
      className="flex-1 gap-2"
    >
      <Play className="h-4 w-4" />
      Video Tour
    </Button>
  </div>
)}
```

#### D. Add Thumbnail Preview Row
Below the main carousel:
```tsx
{allImages.length > 1 && mediaType === 'image' && (
  <div className="flex gap-2 overflow-x-auto py-1">
    {allImages.map((img, idx) => (
      <button
        key={idx}
        onClick={() => carouselApi?.scrollTo(idx)}
        className={cn(
          "w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
          currentSlide === idx 
            ? "border-primary ring-2 ring-primary/30" 
            : "border-transparent opacity-70 hover:opacity-100"
        )}
      >
        <img src={img} alt="" className="w-full h-full object-cover" />
      </button>
    ))}
  </div>
)}
```

#### E. Update Carousel Effect
```tsx
useEffect(() => {
  if (!carouselApi) return;
  
  const onSelect = () => {
    setCurrentSlide(carouselApi.selectedScrollSnap());
  };
  
  carouselApi.on('select', onSelect);
  return () => { carouselApi.off('select', onSelect); };
}, [carouselApi]);

// Reset when workspace changes
useEffect(() => {
  setCurrentSlide(0);
  setMediaType('image');
  carouselApi?.scrollTo(0);
}, [workspace?.id, carouselApi]);
```

---

## Visual Layout

```text
┌────────────────────────────────────────────────────────────────────┐
│                    Book Workspace                                  │
│                    WeWork Embarcadero Center                       │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │              IMAGE CAROUSEL (h-48 = 192px)                   │  │
│  │                                                              │  │
│  │   ◀ ─────────────── Main Image ─────────────── ▶             │  │
│  │                                                              │  │
│  │                       [2 / 4]                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   ← Thumbnail Preview                 │
│  │ T1 │ │ T2 │ │ T3 │ │ T4 │                                       │
│  └────┘ └────┘ └────┘ └────┘                                       │
│                                                                    │
│  ┌────────────────────┐ ┌────────────────────┐                     │
│  │    📷 Photos (4)   │ │   ▶ Video Tour    │   ← Media Toggle     │
│  └────────────────────┘ └────────────────────┘                     │
│                                                                    │
│  📍 Four Embarcadero Center, San Francisco                         │
│                                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ Coworking   │ │ Private Off │ │ Meeting Rm  │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│                                                                    │
│  ───────────────────────────────────────────────────────────────   │
│                                                                    │
│  📅 Select Date        ┌────────────────────┐                      │
│                        │  January 24, 2025  │                      │
│                        └────────────────────┘                      │
│                                                                    │
│  🕐 Start Time         ⏱ Duration                                  │
│  ┌──────────┐          ┌──────────┐                                │
│  │  09:00   │          │ 2 hours  │                                │
│  └──────────┘          └──────────┘                                │
│                                                                    │
│  📝 Notes (optional)                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Any special requirements...                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  💳 Total (2 hours)                              $30         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────┐ ┌──────────────────────────────────────────┐  │
│  │     Cancel      │ │          💳 Pay & Book                   │  │
│  └─────────────────┘ └──────────────────────────────────────────┘  │
│                                                                    │
│               Secure payment powered by Stripe                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useHubsSearch.ts` | Add `videos?: string[]` to Workspace interface |
| `supabase/functions/hub-search-workspaces/index.ts` | Add `videos` array to mock workspaces |
| `src/components/hubs/HubsBookingModal.tsx` | Add carousel, video player, thumbnails, wider modal |

---

## Video Sources (Royalty-Free)

Using high-quality office tour videos from Pexels:
- `3129671` - Modern office space walkthrough
- `3052296` - Coworking space aerial
- `3129957` - Meeting room setup
- `2795168` - Open plan office tour
- `3130284` - Lobby and common area

Each workspace will have 1 video (if appropriate), with images as poster frames.

---

## Expected Result

- **Wider booking modal**: Increased from 512px to 672px for better media viewing
- **Image carousel**: Same functionality as detail panel with swipe/click navigation
- **Thumbnail navigation**: Quick access to any image via preview strip
- **Video support**: Toggle between photos and video tour when available
- **Native video controls**: Play, pause, fullscreen, volume
- **Consistent styling**: Matches glassmorphism design system throughout

