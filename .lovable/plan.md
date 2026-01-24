

# Fix Map Marker Centering for Zoom Persistence

## Problem
Map markers are not staying fixed at the exact center of their coordinates when users zoom in/out of the globe. The `anchor: 'center'` property is already set, but additional CSS is needed to ensure the marker element is truly centered on its coordinate point.

## Root Cause
The marker wrapper element (`el`) has `position: relative` but the child marker element (`markerEl`) takes `width: 100%; height: 100%` without explicit centering. When Mapbox applies the anchor offset, it calculates from the element's top-left corner by default.

## Solution

### 1. Add CSS Transform to Center Markers

Update `src/components/hubs/HubsMapView.tsx` to add explicit centering using CSS transform:

**Marker wrapper element changes:**
```typescript
el.style.cssText = `
  width: ${markerSize}px;
  height: ${markerSize}px;
  cursor: pointer;
  position: absolute;
  transform: translate(-50%, -50%);
`;
```

This ensures the element's center point (not top-left) aligns with the coordinate.

### 2. Add Marker Offset Property

Additionally, set the `offset` option to `[0, 0]` explicitly to prevent any default offsets:

```typescript
const marker = new mapboxgl.Marker({ 
  element: el, 
  anchor: 'center',
  offset: [0, 0]
})
  .setLngLat([workspace.longitude, workspace.latitude])
  .addTo(map.current!);
```

### 3. Ensure Consistent Sizing on Zoom

Add CSS to prevent marker size changes during zoom by using fixed pixel values and not relative units:

```typescript
markerEl.style.cssText = `
  width: ${markerSize}px;
  height: ${markerSize}px;
  min-width: ${markerSize}px;
  min-height: ${markerSize}px;
  max-width: ${markerSize}px;
  max-height: ${markerSize}px;
  background: ...
  ...
`;
```

### 4. Apply Same Fix to User Location Marker

Update the user location marker creation to use the same centering approach:

```typescript
userMarker.current = new mapboxgl.Marker({ 
  element: el, 
  anchor: 'center',
  offset: [0, 0]
})
  .setLngLat([coords.lng, coords.lat])
  .addTo(map.current!);
```

---

## Technical Details

### File to Modify
`src/components/hubs/HubsMapView.tsx`

### Changes Summary

| Location | Change |
|----------|--------|
| Line ~126 | Add `transform: translate(-50%, -50%)` to wrapper element |
| Line ~135 | Add `min-width`, `min-height`, `max-width`, `max-height` to inner marker |
| Line ~180 | Add `offset: [0, 0]` to Marker constructor |
| Line ~247 | Add `offset: [0, 0]` to user location Marker constructor |

### Expected Result
- Markers will remain perfectly centered on their coordinates during all zoom levels
- Markers will not shift position when zooming in/out
- Both workspace markers and user location marker will be properly centered

