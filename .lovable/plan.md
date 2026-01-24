

# Enhance Workspace Detail Panel with Larger Image Carousel

## Summary
Make the workspace booking element bigger with prominent image display, adding a carousel to showcase all available workspace photos so users can better visualize the office space before booking.

---

## Changes Required

### 1. Update Workspace Data Structure

**File: `src/hooks/useHubsSearch.ts`**

Add `images` array to the Workspace interface:
```typescript
export interface Workspace {
  // ... existing fields
  image_url: string | null;
  images?: string[];  // NEW: Array of all workspace images
  // ...
}
```

### 2. Update Mock Data with Multiple Images

**File: `supabase/functions/hub-search-workspaces/index.ts`**

Add multiple images per workspace using relevant Unsplash office/coworking photos:
```typescript
{
  id: "ws-sf-wework-1",
  name: "WeWork Embarcadero Center",
  // ... existing fields
  image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
  images: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
    "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800"
  ],
  // ...
}
```

### 3. Enhance Detail Panel with Image Carousel

**File: `src/components/hubs/HubsDetailPanel.tsx`**

#### A. Increase Header Image Height
Change from `h-32` to `h-56` for much larger image display:
```tsx
<div className="relative h-56 flex-shrink-0">
```

#### B. Add Carousel Component
Replace single image with Embla carousel:
```tsx
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from '@/components/ui/carousel';

// In the header section:
<div className="relative h-56 flex-shrink-0">
  {allImages.length > 0 ? (
    <Carousel className="w-full h-full">
      <CarouselContent className="-ml-0">
        {allImages.map((imageUrl, index) => (
          <CarouselItem key={index} className="pl-0">
            <img
              src={imageUrl}
              alt={`${workspace.name} - Image ${index + 1}`}
              className="w-full h-56 object-cover"
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
      
      {/* Image Counter Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full backdrop-blur-xl bg-black/40 text-white text-xs">
        {currentSlide + 1} / {allImages.length}
      </div>
    </Carousel>
  ) : (
    <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
      <Icon className="h-20 w-20 text-white/60" />
    </div>
  )}
</div>
```

#### C. Add Image State Management
Track current slide for the counter indicator:
```tsx
const [carouselApi, setCarouselApi] = useState<CarouselApi>();
const [currentSlide, setCurrentSlide] = useState(0);

// Combine image_url and images array for carousel
const allImages = useMemo(() => {
  const imgs: string[] = [];
  if (workspace?.images?.length) {
    imgs.push(...workspace.images);
  } else if (workspace?.image_url) {
    imgs.push(workspace.image_url);
  }
  return imgs;
}, [workspace]);

useEffect(() => {
  if (!carouselApi) return;
  
  const onSelect = () => {
    setCurrentSlide(carouselApi.selectedScrollSnap());
  };
  
  carouselApi.on('select', onSelect);
  return () => { carouselApi.off('select', onSelect); };
}, [carouselApi]);
```

#### D. Add Thumbnail Preview Row
Below main carousel, show clickable thumbnails:
```tsx
{allImages.length > 1 && (
  <div className="flex gap-2 p-3 overflow-x-auto">
    {allImages.map((img, idx) => (
      <button
        key={idx}
        onClick={() => carouselApi?.scrollTo(idx)}
        className={cn(
          "w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
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

### 4. Widen the Detail Panel

Increase panel width for larger image display:
```tsx
// Change from w-96 to w-[28rem] (448px)
<div className={cn(
  "absolute right-2 top-2 bottom-2 w-[28rem] z-10 transition-all duration-300",
  // ...
)}>
```

---

## Visual Layout

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              HubsDetailPanel (448px wide)                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │                         IMAGE CAROUSEL (h-56 = 224px)                             │  │
│  │                                                                                   │  │
│  │   ◀ ─────────────────────── Main Image ──────────────────────── ▶                 │  │
│  │                                                                                   │  │
│  │                              [1 / 4]                                              │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   ← Thumbnail Preview Row                                  │
│  │ T1 │ │ T2 │ │ T3 │ │ T4 │                                                            │
│  └────┘ └────┘ └────┘ └────┘                                                            │
│                                                                                         │
│  WeWork Embarcadero Center                                                              │
│  📍 Four Embarcadero Center, San Francisco                                              │
│                                                                                         │
│  ⭐ 4.7                                           $15/hr                                │
│                                                                                         │
│  WORKSPACE TYPES                                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                                        │
│  │ Coworking   │ │ Private Off │ │ Meeting Rm  │                                        │
│  └─────────────┘ └─────────────┘ └─────────────┘                                        │
│                                                                                         │
│  AMENITIES                                                                              │
│  📶 High-Speed WiFi                                                                     │
│  ☕ Coffee & Beverages                                                                  │
│  🅿️ Parking Available                                                                   │
│                                                                                         │
│  ┌────────────┐ ┌────────────┐                                                          │
│  │ Directions │ │   Share    │                                                          │
│  └────────────┘ └────────────┘                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                           [ 📅 Book Now ]                                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useHubsSearch.ts` | Add `images?: string[]` to Workspace interface |
| `supabase/functions/hub-search-workspaces/index.ts` | Add `images` array to each mock workspace |
| `src/components/hubs/HubsDetailPanel.tsx` | Add carousel, increase height, add thumbnails |

---

## Professional Office Images (Unsplash)

For each workspace, I'll use a curated set of professional office/coworking photos:

**General Office/Coworking:**
- `photo-1497366216548-37526070297c` (Modern open office)
- `photo-1497366754035-f200968a6e72` (Glass office interior)
- `photo-1524758631624-e2822e304c36` (Designer workspace)
- `photo-1556761175-4b46a572b786` (Collaborative space)
- `photo-1519389950473-47ba0277781c` (Team working)
- `photo-1504384308090-c894fdcc538d` (Creative office)
- `photo-1517502884422-41eaead166d4` (Meeting room)
- `photo-1462826303086-329426d1aef5` (Modern desk)
- `photo-1527192491265-7e15c55b1ed2` (Open workspace)
- `photo-1564069114553-7215e1ff1890` (Coworking lounge)
- `photo-1572025442646-866d16c84a54` (Coffee area)
- `photo-1568992687947-868a62a9f521` (Office lobby)

Each workspace will have 3-4 varied images showing different areas (desks, meeting rooms, common areas, amenities).

---

## Expected Result

- **Much larger images**: Header image increased from 128px to 224px height
- **Interactive carousel**: Users can swipe/click through multiple office photos
- **Thumbnail navigation**: Quick access to any image via preview strip
- **Slide counter**: Shows current position (e.g., "2 / 4")
- **Wider panel**: Panel width increased for better image viewing
- **Glassmorphism navigation**: Previous/Next buttons match design system

