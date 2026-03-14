

# Fix: Infinite Reload Loop

## Root Cause Analysis

After thorough investigation of the codebase, there are **two interacting problems** causing the continuous reloading:

### 1. Circular dependency in `useEarthIntelligence.ts`
- `enableLayerOnMap` (line 701) depends on `earthLayers` in its useCallback deps
- `enableLayerOnMap` also calls `setEarthLayers` (line 713)
- `disableLayerOnMap` (line 689) also calls `setEarthLayers` (line 697)
- Both are called inside the `useEffect` at line 778 which depends on `[temporalMode, dayNightMode, precipMode, mapReady]`
- While not directly in that effect's deps, the `toggleDataset` callback (line 730) depends on `enableLayerOnMap` and `disableLayerOnMap`, and is passed up to the parent `GlobalResourcesMap` component
- When `enableLayerOnMap` or `disableLayerOnMap` change identity (because `earthLayers` changed), the parent re-renders, which triggers the massive 3009-line `GlobalResourcesMap` to re-render all 113 useEffects

### 2. Rapid state cascade in `GlobalResourcesMap.tsx`
- The component has **113 useEffect hooks** across 3009 lines
- Multiple effects update state that triggers other effects (e.g., `selectedResource` update at line 693-704 reacts to `resources` changes, real-time subscription at line 669 triggers `refetchResources` which changes `resources`)
- The `MapCommandCenter` ticks every second via `setTick` when recording sessions are active (line 365-370)
- Camera data updates from `useTrafficCameras` trigger the camera layer effect (line 1321) which triggers map repaints

## Plan

### Step 1: Stabilize `useEarthIntelligence` callbacks
- Change `enableLayerOnMap` and `disableLayerOnMap` to use refs for `earthLayers` instead of including it in useCallback deps
- This prevents the cascade of identity changes flowing through `toggleDataset` and `setDatasetOpacity`

### Step 2: Break re-render chain in `GlobalResourcesMap`
- Memoize the `trafficCameras` array reference in `useTrafficCameras` to prevent unnecessary camera layer effect triggers (use a ref-based comparison to only update state when camera data actually changes)
- Guard the `selectedResource` sync effect (line 693) with a deep equality check to prevent unnecessary `setSelectedResource` calls

### Step 3: Stabilize `MapCommandCenter` tick
- Move the tick interval into a child component so the 1-second re-renders don't propagate up to the full map component

## Files to Change

- `src/hooks/useEarthIntelligence.ts` — Use refs for `earthLayers` in callbacks
- `src/hooks/useTrafficCameras.ts` — Memoize camera array with ref-based diffing
- `src/components/GlobalResourcesMap.tsx` — Guard `selectedResource` effect
- `src/components/earth/MapCommandCenter.tsx` — Isolate tick into sub-component

