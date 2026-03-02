

## Problem

1. **Categories not displaying properly** in the Earth Intelligence sidebar — layers render but the category sections may not be toggling/showing correctly.
2. **Too many duplicate cards** — datasets like "Land Surface Temp" appear 4 times (Day/Monthly, Day/Daily, Night/Monthly, Night/Daily). Same for SST layers. These should be **consolidated into a single card per dataset**, with temporal/day-night configuration moved to the **bottom viewport toolbar**.

## Plan

### 1. Consolidate duplicate layers into single "dataset groups"

Introduce a new concept: **EarthDataset** — a single consolidated entry that represents multiple underlying layers.

| Dataset Card | Underlying Layer IDs | Configurable Options |
|---|---|---|
| Land Surface Temperature | lst-day-monthly, lst-day-daily, lst-night-monthly, lst-night-daily | Day/Night + Monthly/Daily |
| SST (GCOM-C) | sst-gcomc-day-monthly, sst-gcomc-night-monthly, sst-gcomc-day-daily, sst-gcomc-night-daily | Day/Night + Monthly/Daily |
| SST (GCOM-W) | sst-gcomw-day-daily, sst-gcomw-night-daily | Day/Night (daily only) |
| GSMaP Precipitation | gsmap-precipitation, gsmap-precipitation-monthly | Real-time/Monthly |
| Shortwave Radiation | swr-modis-monthly | No toggles (monthly only) |
| ALOS Elevation | jaxa-aw3d30 | None |
| Land Surface Hillshade | jaxa-hillshade | None |

**Files**: `src/hooks/useEarthIntelligence.ts`
- Define a `EARTH_DATASETS` array with grouped metadata (name, description, icon, category, available modes)
- Add state for active dataset's temporal config: `activeTemporalMode` (daily/monthly) and `activeDayNight` (day/night)
- When user toggles a dataset ON, activate the correct underlying layer based on current temporal settings
- When user changes temporal mode in toolbar, swap the active underlying layer
- Export `activeDatasetId`, `temporalMode`, `dayNightMode`, and setters

### 2. Update `EarthLayerCard` to show consolidated datasets

**File**: `src/components/earth/EarthLayerCard.tsx`
- Accept a dataset group object instead of individual layers
- Show one card with name, description, icon, toggle switch, and opacity slider
- Remove the Day/Night and Monthly/Daily badges from cards (moved to toolbar)

### 3. Update `EarthCategorySection` to use dataset groups

**File**: `src/components/earth/EarthCategorySection.tsx`
- Render one card per dataset group instead of per layer

### 4. Add temporal controls to the bottom toolbar

**File**: `src/components/earth/EarthViewportToolbar.tsx`
- When a dataset with day/night support is active, show a **Day/Night toggle** (sun/moon icons)
- When a dataset with daily+monthly support is active, show a **Daily/Monthly segmented toggle**
- These appear alongside the existing date stepper controls
- Style matches the existing toolbar aesthetic (rounded, backdrop-blur, dark)

### 5. Fix category display in sidebar

**File**: `src/components/GlobalResourcesMap.tsx`
- Pass consolidated dataset groups to `EarthCategorySection` instead of raw layers
- Ensure the Earth Intelligence panel renders categories correctly with proper filtering

### Summary of changes

| File | Change |
|---|---|
| `src/hooks/useEarthIntelligence.ts` | Add dataset grouping, temporal mode state, layer swapping logic |
| `src/components/earth/EarthLayerCard.tsx` | Render consolidated dataset cards (no time badges) |
| `src/components/earth/EarthCategorySection.tsx` | Accept dataset groups |
| `src/components/earth/EarthViewportToolbar.tsx` | Add Day/Night + Daily/Monthly toggles |
| `src/components/GlobalResourcesMap.tsx` | Wire up consolidated datasets and new toolbar props |

