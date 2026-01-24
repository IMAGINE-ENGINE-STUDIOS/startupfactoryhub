
# Redesign /hubs to Match Resources Tab Design + Fix Icons & Stripe Integration

## Summary
Completely redesign the `/hubs` page to mirror the Resources tab's glassmorphism design system, fix map marker centering, enlarge workspace images, and integrate Stripe payments for booking.

---

## 1. UI Redesign to Match GlobalResourcesMap

### Layout Changes
- **Full-viewport 3D globe** (no header bar at top - clean globe view)
- **Left sliding panel** with glassmorphism styling (`backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-3xl`)
- **Right detail panel** that slides in when a workspace is selected (same glassmorphism styling)
- **Menu toggle button** with tech-card styling positioned at `top-4 left-4`
- **Map controls** (rotation toggle, my location) positioned at `top-32 right-3` below Mapbox nav controls

### Glassmorphism Styling
Apply consistent tech-card styling across all UI elements:
```css
backdrop-blur-3xl bg-white/10 dark:bg-black/20 
border border-white/30 dark:border-white/20 
shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] 
rounded-3xl
```

### Files to Modify
- `src/pages/Hubs.tsx` - Complete layout overhaul
- `src/components/hubs/HubsMapView.tsx` - Fix markers, add controls matching Resources

---

## 2. Fix Map Marker Centering

### Current Issue
Markers use custom HTML elements but may not be perfectly centered on coordinates.

### Solution
Update marker creation in `HubsMapView.tsx`:
```typescript
const marker = new mapboxgl.Marker({ 
  element: el, 
  anchor: 'center'  // Ensure center anchor
})
  .setLngLat([workspace.longitude, workspace.latitude])
  .addTo(map.current!);
```

Also improve marker styling to match Resources globe markers:
- Proper circular shape with gradient
- Hover effects with scale transform
- Building icon centered within marker

---

## 3. Larger Workspace Images

### Detail Panel Images
Increase image size in the right detail panel:
- Current: `w-20 h-20` (80px)
- New: Full-width header image `w-full h-40` (like Resources panel uses `h-32`)

### Workspace Cards
Increase card image prominence:
- Current compact: `w-16 h-16`
- New compact: `w-20 h-20`
- Detail view: Full-width `h-48` header image

### Files to Modify
- `src/components/hubs/HubsWorkspaceCard.tsx` - Larger images
- New `HubsWorkspaceDetailPanel.tsx` - Right slide-in panel with large header image

---

## 4. Stripe Payment Integration

### Current State
- Edge function `hub-book-workspace` already handles Stripe checkout
- Frontend `HubsBookingModal` doesn't call the edge function

### Required Changes

#### A. Update `HubsBookingModal.tsx`
Replace direct database insert with Stripe checkout flow:
```typescript
const handleSubmit = async () => {
  const { data, error } = await supabase.functions.invoke('hub-book-workspace', {
    body: {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedTime,
      endTime: calculateEndTime(),
      pricePerHour: workspace.hourly_rate_min || 25,
      notes
    }
  });

  if (data?.url) {
    window.open(data.url, '_blank'); // Opens Stripe Checkout
  }
};
```

#### B. Handle Success Callback
Add query param detection in `Hubs.tsx` to show success message when returning from Stripe:
```typescript
const [searchParams] = useSearchParams();
const bookingStatus = searchParams.get('booking');

useEffect(() => {
  if (bookingStatus === 'success') {
    toast({ title: "Booking Confirmed!", description: "Check your email for details" });
  }
}, [bookingStatus]);
```

---

## 5. Component Structure

### New/Modified Files

| File | Changes |
|------|---------|
| `src/pages/Hubs.tsx` | Complete redesign - remove header, add sliding panels |
| `src/components/hubs/HubsMapView.tsx` | Fix marker centering, add rotation/location controls |
| `src/components/hubs/HubsWorkspaceCard.tsx` | Larger images, glassmorphism styling |
| `src/components/hubs/HubsBookingModal.tsx` | Stripe checkout integration |
| `src/components/hubs/HubsDetailPanel.tsx` | NEW - Right slide-in panel for workspace details |
| `src/components/hubs/HubsSearchFilters.tsx` | Glassmorphism styling update |

---

## 6. Technical Details

### Map Controls Positioning
```typescript
// Rotation toggle and My Location buttons
<div className="absolute top-32 right-3 z-10 flex flex-col gap-2">
  <Button 
    size="icon"
    onClick={toggleRotation}
    className="backdrop-blur-2xl bg-white/10 border border-white/30 rounded-2xl"
  >
    {isRotating ? <Pause /> : <Play />}
  </Button>
  <Button 
    size="icon"
    onClick={handleLocateUser}
    className="backdrop-blur-2xl bg-white/10 border border-white/30 rounded-2xl"
  >
    <Locate />
  </Button>
</div>
```

### Left Panel Structure
- Header with title and close button
- Search input with address autocomplete
- Workspace type filters (All, Hot Desk, Private Office, Meeting Room, Coworking)
- Amenity filters
- Price range slider

### Right Detail Panel
- Slides in from right when workspace selected
- Full-width header image (h-40)
- Workspace name and location
- Workspace types badges
- Amenities list
- Rating and pricing
- "Book Now" button that triggers Stripe checkout
- Close button (X) in header

---

## 7. Implementation Order

1. **HubsMapView.tsx** - Fix marker centering and add proper controls
2. **Hubs.tsx** - Restructure layout to match Resources (remove header, add sliding panels)
3. **HubsDetailPanel.tsx** - Create new right panel component with large images
4. **HubsWorkspaceCard.tsx** - Update to glassmorphism styling
5. **HubsBookingModal.tsx** - Integrate Stripe checkout
6. **HubsSearchFilters.tsx** - Apply glassmorphism styling

This will result in a `/hubs` page that matches the premium look and feel of the Resources tab while enabling real Stripe payments for workspace bookings.
