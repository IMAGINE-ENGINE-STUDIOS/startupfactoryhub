
# Optimize Resource Map Loading Performance

## Problem Analysis

After analyzing the codebase, I identified several performance bottlenecks causing slow rendering of resources on the map:

### Bottleneck 1: Sequential Logo Image Loading
**Location**: `src/components/GlobalResourcesMap.tsx` (lines 710-798)
- Each resource with a logo triggers a separate canvas-based image creation via `createCircleMarkerIcon()`
- Images are loaded one by one with a concurrency limit of 6, but each involves:
  - Creating an HTMLImageElement
  - Loading the image from URL (network request)
  - Drawing to canvas
  - Converting to ImageData
  - Adding to Mapbox style

**Impact**: With 50+ resources, this can take 10-20+ seconds

### Bottleneck 2: N+1 Query Problem in Events Hook
**Location**: `src/hooks/useEventsForMap.ts` (lines 65-87)
- For each event, two additional queries are executed sequentially:
  - Fetch organizer profile (`profiles` table)
  - Fetch attendee count (`event_attendees` table)
- With 10 events, this creates 20+ additional database calls

### Bottleneck 3: No Lazy Loading for Off-Screen Markers
- All resource logo images are processed immediately, even for resources not currently visible on the globe
- No prioritization based on viewport

### Bottleneck 4: Real-time Subscriptions Trigger Full Refetch
**Location**: `src/components/GlobalResourcesMap.tsx` (lines 432-452)
- Any change to the `resources` table triggers a complete refetch and marker rebuild

---

## Optimization Strategy

### Phase 1: Optimize Events Query (Quick Win)

**File**: `src/hooks/useEventsForMap.ts`

Replace the N+1 query pattern with a single joined query:

```typescript
const { data: events, error } = await supabase
  .from('events')
  .select(`
    id, title, description, location, start_date, end_date,
    banner_url, max_attendees, organizer_id, latitude, longitude,
    city, country, is_virtual,
    profiles!organizer_id(full_name, avatar_url)
  `)
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .eq('is_virtual', false)
  .gte('end_date', now)
  .lte('start_date', thirtyDaysFromNow.toISOString())
  .order('start_date', { ascending: true });

// Fetch all attendee counts in a single query
const eventIds = events.map(e => e.id);
const { data: attendeeCounts } = await supabase
  .from('event_attendees')
  .select('event_id')
  .in('event_id', eventIds)
  .eq('status', 'going');

// Count in JavaScript
const countMap = attendeeCounts.reduce((acc, a) => {
  acc[a.event_id] = (acc[a.event_id] || 0) + 1;
  return acc;
}, {});
```

**Result**: Reduces 2N+1 queries to just 2 queries

---

### Phase 2: Implement Progressive Logo Loading

**File**: `src/components/GlobalResourcesMap.tsx`

Instead of loading all logos at once, implement viewport-based prioritization:

1. **Show type icons immediately** (already implemented)
2. **Prioritize visible resources** - Load logos for resources currently in viewport first
3. **Increase concurrency** - Bump from 6 to 10 parallel loads
4. **Add image caching layer** - Cache loaded Image objects in a Map to avoid re-fetching

```typescript
// Add viewport-based prioritization
const getVisibleResources = () => {
  if (!map.current) return new Set<string>();
  const bounds = map.current.getBounds();
  return new Set(
    physicalResources
      .filter(r => bounds.contains([r.longitude!, r.latitude!]))
      .map(r => r.id)
  );
};

// Sort logos to load visible ones first
const visibleIds = getVisibleResources();
logoIconsToLoad.sort((a, b) => {
  const aVisible = visibleIds.has(a.resource.id) ? 0 : 1;
  const bVisible = visibleIds.has(b.resource.id) ? 0 : 1;
  return aVisible - bVisible;
});
```

---

### Phase 3: Add Image Preload Cache

**File**: `src/lib/mapMarkerIcons.ts`

Add a persistent cache for loaded images:

```typescript
// Global image cache to prevent re-fetching
const imageCache = new Map<string, HTMLImageElement>();

async function loadImage(src: string): Promise<HTMLImageElement> {
  // Check cache first
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}
```

---

### Phase 4: Reduce Marker Update Frequency

**File**: `src/components/GlobalResourcesMap.tsx`

1. **Debounce real-time updates** - Don't rebuild markers for every database change
2. **Use React Query's `staleTime`** more aggressively (already set to 5 minutes)
3. **Skip full rebuild for single-resource updates**

```typescript
// Debounce real-time subscription handler
const debouncedRefetch = useRef(
  debounce(() => refetchResources(), 2000)
).current;

// In subscription handler
.on('postgres_changes', 
  { event: '*', schema: 'public', table: 'resources' },
  (payload) => {
    // Only update selectedResource immediately for visual feedback
    if (selectedResource && payload.new?.id === selectedResource.id) {
      setSelectedResource(payload.new as Resource);
    }
    // Debounce the full refetch
    debouncedRefetch();
  }
)
```

---

### Phase 5: Add Loading Progress Indicator

**File**: `src/components/GlobalResourcesMap.tsx`

Add visual feedback so users know markers are loading:

```typescript
const [loadingProgress, setLoadingProgress] = useState(0);
const [totalToLoad, setTotalToLoad] = useState(0);

// In updateResourceMarkers()
setTotalToLoad(logoIconsToLoad.length);
setLoadingProgress(0);

// After each logo loads
setLoadingProgress(prev => prev + 1);

// In JSX
{totalToLoad > 0 && loadingProgress < totalToLoad && (
  <div className="absolute bottom-20 left-4 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-lg text-xs text-white">
    Loading markers: {loadingProgress}/{totalToLoad}
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useEventsForMap.ts` | Replace N+1 queries with joined query + batch count |
| `src/components/GlobalResourcesMap.tsx` | Add viewport prioritization, debounced updates, loading indicator |
| `src/lib/mapMarkerIcons.ts` | Add image caching layer |

---

## Expected Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Initial marker display | 3-5 seconds | < 1 second (type icons) |
| All logos loaded | 15-25 seconds | 5-8 seconds (prioritized) |
| Events query time | ~2 seconds (N+1) | ~200ms (2 queries) |
| Real-time update lag | Immediate full rebuild | 2-second debounced smart update |

---

## Technical Details

### Viewport-Based Loading Strategy
1. Markers appear instantly using type icons (colored circles with resource type symbols)
2. Logo loading begins in background with visible resources prioritized
3. As logos load, markers progressively upgrade from type icons to logo images
4. Debounced 250ms refresh batches multiple logo completions

### Image Cache Persistence
- Images cached in memory for session duration
- Prevents re-loading when user switches filters and returns
- Reduces network requests on repeat views
