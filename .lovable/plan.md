
# Redesign Hubs Page to Match GlobalResourcesMap Exactly

## Goal
Rebuild `/hubs` to be an **exact replica** of the Resources tab (`GlobalResourcesMap.tsx`), ensuring seamless future integration. When users click "venue", "office", or "coworking" in the Resources tab categories, the workspace marketplace will appear fluently within the same interface.

---

## Current State Analysis

### GlobalResourcesMap Structure:
1. **Full-viewport 3D globe** with custom Mapbox styling
2. **Left sliding panel** with:
   - Header: "Resources Map" with MapPin icon
   - Search input with address autocomplete (Mapbox Geocoding)
   - **Categories list** (scrollable buttons for each ResourceType)
   - **Journey Stage filter** section
   - "Add Resource" button at bottom
3. **Right sliding panel** for selected resource/event details
4. **Control buttons** positioned at `top-4 left-1/2 -translate-x-1/2` (desktop) or `bottom-52 right-4` (mobile):
   - Rotation toggle (Pause/Play)
   - My Location (Locate)
   - Tracking Session (Radio)
   - Accelerator HQ (Home) - conditional
5. **Bottom collapsible sections**:
   - Online Resources (bottom-36)
   - Perks (bottom-20)
6. **Menu toggle button** that moves with panel: `left-[348px]` when open, `left-4` when closed

### Current Hubs Page Differences:
- Different header layout (centered logo instead of in-panel)
- Different left panel structure (Workspaces title, filters inline)
- Separate AI Assistant panel (not in Resources)
- Different control button positioning
- Missing Categories-style navigation
- Missing perks/online resources sections

---

## Implementation Plan

### Phase 1: Restructure Hubs.tsx Layout

Replace the current layout with the exact GlobalResourcesMap structure:

```tsx
// Layout structure to match GlobalResourcesMap exactly:
<div className="relative w-full h-full bg-background overflow-hidden rounded-2xl">
  {/* Full Viewport Map */}
  <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-2xl" />
  
  {/* Control Buttons - matching GlobalResourcesMap positioning */}
  {/* Menu Toggle Button - moves with panel */}
  {/* Left Side Sliding Panel - identical structure */}
  {/* Right Side Panel - Resource/Workspace Details */}
</div>
```

### Phase 2: Left Panel - Exact Category Match

The left panel must have:

1. **Header**: "Workspaces" with Building2 icon (matches "Resources Map" with MapPin)
2. **Search**: Address autocomplete using Mapbox Geocoding API (same implementation)
3. **Categories Section**:
   - "All Workspaces" button (like "All Resources")
   - Category buttons for each workspace type:
     - Hot Desk (Users icon, teal color)
     - Private Office (DoorOpen icon, blue color)  
     - Meeting Room (Presentation icon, purple color)
     - Coworking (Building2 icon, emerald color)
     - Event Space (CalendarDays icon, rose color)
   - Each button with left border highlight when selected
4. **Amenities Filter** section (new, below categories)
5. **Budget Slider** (collapsible)

### Phase 3: Control Buttons - Exact Positioning

Move controls to match GlobalResourcesMap:
- **Desktop**: `top-4 left-1/2 -translate-x-1/2` (center-top)
- **Mobile**: `bottom-52 right-4 flex-col`

Buttons included:
- Rotation toggle (Pause/Play)
- My Location (Locate)
- Tracking session could be optional for Hubs

### Phase 4: Menu Toggle Button

Exact positioning:
```tsx
<Button
  className={cn(
    "absolute top-4 z-20 backdrop-blur-2xl bg-white/10...",
    isMobile ? "left-4" : (isLeftPanelOpen ? "left-[348px]" : "left-4")
  )}
>
  {isLeftPanelOpen && !isMobile ? <X /> : <Menu />}
</Button>
```

### Phase 5: Right Detail Panel - Match Resource Panel

Current HubsDetailPanel needs adjustments:
- Position: `right-2 top-2 bottom-2 w-96` (not `right-4 top-16 bottom-4 w-80`)
- Transition: Same slide animation
- Structure:
  - Header with title and close button
  - Image (h-32) or gradient fallback
  - ScrollArea content
  - Action buttons (Book Now, Get Directions, Visit Website, Bookmark, Share)

### Phase 6: Map Markers - Match Resource Markers

Update HubsMapView to use identical marker styling:
- Same size (36px standard, 44px for featured)
- Same gradient colors based on workspace type
- Same hover effects and animations
- Use `anchor: 'center'` (already done)

### Phase 7: Future Integration Point

The redesigned Hubs page will integrate with GlobalResourcesMap when users select:
- `venue` → Show venues + workspaces
- `office` → Show offices + private offices
- `coworking` → Show coworking spaces

This is achieved by:
1. Making the Hubs components reusable
2. Using the same data structure patterns
3. Matching visual styling exactly

---

## Technical Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Hubs.tsx` | Complete restructure to match GlobalResourcesMap layout |
| `src/components/hubs/HubsMapView.tsx` | Match control positions, marker styling, globe config |
| `src/components/hubs/HubsDetailPanel.tsx` | Match right panel structure from GlobalResourcesMap |
| `src/components/hubs/HubsSearchFilters.tsx` | Convert to category buttons (like RESOURCE_CONFIG) |

### Left Panel Structure (Exact Match)

```tsx
// Header
<div className="p-4 border-b border-white/30 backdrop-blur flex items-center justify-between">
  <h2 className="text-lg font-semibold flex items-center gap-2">
    <Building2 className="w-5 h-5" />
    Workspaces
  </h2>
  {isMobile && <Button onClick={close}><X /></Button>}
</div>

// Search with Mapbox autocomplete
<div className="p-4 border-b border-white/30 backdrop-blur">
  <Input placeholder="Search workspaces or addresses..." />
  {/* Address suggestions dropdown */}
</div>

// Categories (scrollable)
<ScrollArea className="flex-1">
  <div className="p-4">
    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase">Categories</h3>
    <div className="space-y-1">
      <Button variant={selected === null ? 'default' : 'ghost'}>
        All Workspaces
      </Button>
      {WORKSPACE_TYPES.map(type => (
        <Button
          key={type.value}
          className={cn(
            "w-full justify-start gap-2 rounded-xl",
            isSelected && "border-l-4"
          )}
          style={isSelected ? { borderLeftColor: type.color } : {}}
        >
          <type.icon className="w-4 h-4" />
          {type.label}
        </Button>
      ))}
    </div>
  </div>
</ScrollArea>
```

### Workspace Types Config (Like RESOURCE_CONFIG)

```tsx
const WORKSPACE_CONFIG = {
  hot_desk: { icon: Users, color: '#14b8a6', label: 'Hot Desk' },
  private_office: { icon: DoorOpen, color: '#3b82f6', label: 'Private Office' },
  meeting_room: { icon: Presentation, color: '#8b5cf6', label: 'Meeting Room' },
  coworking: { icon: Building2, color: '#10b981', label: 'Coworking' },
  event_space: { icon: CalendarDays, color: '#f43f5e', label: 'Event Space' },
};
```

### Control Buttons Positioning

```tsx
// Match GlobalResourcesMap exactly
<div className={cn(
  "absolute z-20 flex gap-2",
  isMobile 
    ? "bottom-52 right-4 flex-col" 
    : "top-4 left-1/2 -translate-x-1/2"
)}>
  <Button onClick={toggleRotation}>
    {isRotating ? <Pause /> : <Play />}
  </Button>
  <Button onClick={locateUser}>
    {isLocating ? <Loader2 className="animate-spin" /> : <Locate />}
  </Button>
</div>
```

### Right Panel Positioning

```tsx
// Match GlobalResourcesMap right panel
<div className={cn(
  "absolute right-2 top-2 bottom-2 w-96 z-10 transition-all duration-300",
  selectedWorkspace 
    ? "translate-x-0 opacity-100" 
    : "translate-x-full opacity-0 pointer-events-none"
)}>
```

---

## Stripe Integration (Preserved)

The booking flow remains intact:
1. User clicks "Book Now" in detail panel
2. `HubsBookingModal` opens with date/time selection
3. On submit → calls `hub-book-workspace` Edge Function
4. Edge Function creates Stripe Checkout Session
5. User redirected to Stripe, then back to `/hubs?booking=success`

---

## Summary

This plan ensures `/hubs` becomes an **exact visual and structural replica** of the Resources tab (`GlobalResourcesMap`), enabling seamless future integration. When users click venue/office/coworking categories in Resources, the workspace data will display using the same interface patterns.
