

# Advanced GIS Test Environment

## Overview
Create a sandboxed test page at `/hubs-lab` with a dedicated map component to safely develop and test advanced GIS features (satellite imagery, 3D models, external tracking APIs) without affecting the production `/hubs` page.

---

## Implementation Approach

The test environment will be a complete copy of the current Hubs infrastructure with the new GIS capabilities added. Once features are tested and approved, they can be merged into the original components.

---

## Files to Create

### 1. Test Page: `src/pages/HubsLab.tsx`
A copy of the current `Hubs.tsx` that uses the experimental map component instead:
- Same layout and functionality as `/hubs`
- Uses `HubsMapViewLab` instead of `HubsMapView`
- Includes the GIS Control Panel for layer management
- Accessible at route `/hubs-lab`

### 2. Experimental Map: `src/components/hubs/HubsMapViewLab.tsx`
Enhanced version of `HubsMapView.tsx` with new GIS capabilities:
- **Satellite Layer Toggle** - Switch between default globe and satellite imagery
- **3D Model Support** - glTF model loading with custom layer interface
- **External Tracking Markers** - Real-time entity display from external APIs
- **GIS Layer Management** - Add/remove custom GeoJSON data layers
- All existing functionality preserved (rotation, markers, user location)

### 3. GIS Control Panel: `src/components/hubs/GISControlPanel.tsx`
UI component for managing advanced GIS features:
- Base map style selector (Default / Satellite / Satellite Streets)
- Data layers toggle panel (for future GeoJSON sources)
- Live tracking provider toggles (placeholder for API integrations)
- Collapsible panel design matching existing glassmorphism style

### 4. GIS Layers Hook: `src/hooks/useGISLayers.ts`
React hook for managing custom map layers:
- `addLayer()` - Add GeoJSON/vector sources with custom styling
- `removeLayer()` - Remove layers by ID
- `toggleLayerVisibility()` - Show/hide layers
- `updateLayerData()` - Update GeoJSON data in real-time

### 5. External Tracking Hook: `src/hooks/useExternalTracking.ts`
React hook for real-time entity tracking:
- `TrackingProvider` interface for API configuration
- Polling mechanism with configurable intervals
- Entity normalization to standard format
- Enable/disable individual providers

### 6. Tracking Markers Component: `src/components/hubs/ExternalTrackingMarkers.tsx`
Renders tracked entities on the map:
- Animated markers with smooth position transitions
- Entity-type-specific icons (vehicle, delivery, drone, asset)
- Click handlers for entity details
- Automatic cleanup of stale markers

### 7. Route Registration in `src/App.tsx`
Add lazy-loaded route for the test page:
```typescript
const HubsLab = lazy(() => import("./pages/HubsLab"));
// ...
<Route path="/hubs-lab" element={<HubsLab />} />
```

---

## New GIS Features in Test Environment

| Feature | Implementation |
|---------|----------------|
| **Satellite Imagery** | `map.setStyle()` toggle between 3 Mapbox styles |
| **Custom Data Layers** | `map.addSource()` + `map.addLayer()` for GeoJSON |
| **3D Models (glTF)** | Native Mapbox `model` layer type |
| **3D Models (FBX)** | Three.js `CustomLayerInterface` bridge |
| **Real-time Tracking** | Polling hook + animated marker updates |
| **Heatmaps** | Mapbox `heatmap` layer type |
| **Building Extrusions** | `fill-extrusion` layer for 3D buildings |

---

## Map Styles Available

```typescript
const MAP_STYLES = {
  default: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
};
```

---

## Testing Workflow

1. Navigate to `/hubs-lab` (requires authentication)
2. Use GIS Control Panel to toggle features:
   - Switch between map styles (globe/satellite)
   - Enable/disable tracking providers
   - Toggle data layers
3. Test marker interactions and layer rendering
4. Verify performance with multiple layers active
5. Once approved, merge changes into production `/hubs`

---

## Technical Details

### Satellite Layer Toggle
```typescript
const [mapStyle, setMapStyle] = useState<'default' | 'satellite' | 'satelliteStreets'>('default');

const handleStyleChange = (style: keyof typeof MAP_STYLES) => {
  setMapStyle(style);
  map.current?.setStyle(MAP_STYLES[style]);
  // Re-add markers after style change
};
```

### 3D Model Loading (glTF)
```typescript
map.addSource('3d-model', {
  type: 'model',
  models: {
    'building-model': {
      uri: '/models/building.glb',
      position: [-80, 20],
      orientation: [0, 0, 0]
    }
  }
});

map.addLayer({
  id: '3d-model-layer',
  type: 'model',
  source: '3d-model',
  layout: { 'model-id': 'building-model' },
  paint: { 'model-opacity': 1 }
});
```

### External Tracking Entity Interface
```typescript
interface TrackedEntity {
  id: string;
  type: 'vehicle' | 'delivery' | 'drone' | 'asset';
  name: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  icon?: string;
  metadata?: Record<string, any>;
  lastUpdated: string;
}
```

---

## File Summary

| File | Type | Purpose |
|------|------|---------|
| `src/pages/HubsLab.tsx` | Create | Test page at `/hubs-lab` |
| `src/components/hubs/HubsMapViewLab.tsx` | Create | Enhanced map with GIS features |
| `src/components/hubs/GISControlPanel.tsx` | Create | Layer/style management UI |
| `src/hooks/useGISLayers.ts` | Create | Custom layer management hook |
| `src/hooks/useExternalTracking.ts` | Create | External API tracking hook |
| `src/components/hubs/ExternalTrackingMarkers.tsx` | Create | Tracking entity markers |
| `src/App.tsx` | Modify | Add `/hubs-lab` route |

