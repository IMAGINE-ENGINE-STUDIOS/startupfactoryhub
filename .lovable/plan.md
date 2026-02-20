
# Replace "Village" with "District" + Move Districts to Social Tab

## Summary
Three changes: (1) replace all remaining "village" references with "district" in user-facing text and code, (2) hide the Marketplace button, (3) move the entire District section from the Meetings tab into the Social tab, placed right after the Shorts carousel.

---

## Changes

### 1. Replace remaining "village" text across components

**Files affected:**
- `src/components/DistrictRooms.tsx` -- rename `village_type` references in UI labels (e.g., `merchant_village` display text stays as DB value but UI shows "Merchant District"), rename interface comments
- `src/components/DistrictDetailPanel.tsx` -- rename `VILLAGE_MEDIA`, `VILLAGE_EMOJIS` constants to `DISTRICT_MEDIA`, `DISTRICT_EMOJIS`; update comment headers; rename `VillageDetailPanelProps` to `DistrictDetailPanelProps`; update `village-detail-` channel name to `district-detail-`; rename exported function
- `src/components/DistrictElectionPanel.tsx` -- rename `VillageElectionPanelProps` to `DistrictElectionPanelProps`; update dialog title from "Village Election" to "District Election"; update description text
- `src/components/DistrictGuideDialog.tsx` -- any remaining "village" wording in guide text
- `src/components/DistrictMarketplace.tsx` -- any remaining "village" table references stay (DB names unchanged), but UI text updated
- `src/components/CreateDistrictDialog.tsx` -- update `merchant_village` display labels to "Merchant District"
- `src/components/admin/DistrictsManagement.tsx` -- any remaining "village" labels

### 2. Hide the Marketplace button

**File:** `src/components/DistrictRooms.tsx`
- Remove or comment out the Marketplace button (lines 171-179)
- Keep the `DistrictMarketplace` component import and dialog rendered but unreachable for now (so it can be re-enabled later)

### 3. Move District section from Meetings tab to Social tab

**File:** `src/components/LiveRooms.tsx`
- Remove the `<DistrictRooms />` render from this component (line 78)
- Remove the `DistrictRooms` import

**File:** `src/pages/Dashboard.tsx`
- Import `DistrictRooms` directly
- In the Social tab content (line 380-382), add `<DistrictRooms />` after `<UnifiedCommunityFeed />`, so the order becomes:
  1. UnifiedCommunityFeed (which contains Shorts carousel at the top)
  2. DistrictRooms section (below shorts and posts)

---

## Technical Notes
- Database column names (`village_type`, `village_elections`, `village_staff`, `village_marketplace`) remain unchanged -- only UI-facing strings are updated
- The Marketplace feature is hidden but not deleted, so it can be restored with a single line change
- No new dependencies or migrations needed
