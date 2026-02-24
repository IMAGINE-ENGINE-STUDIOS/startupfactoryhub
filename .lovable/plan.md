
## Merge Pitches and Meetings Tabs on Investor Dashboard

Since the Pitches tab and Meetings tab on the Investor Dashboard contain overlapping content, this plan consolidates them into a single "Meetings" tab.

### Changes (all in `src/pages/InvestorDashboard.tsx`):

1. **Remove the "Meetings" TabsTrigger** (the one with the Video icon at line 568-571)
2. **Rename the "Pitches" TabsTrigger** from "Pitches" to "Meetings" (keep the same `value="pitches"` internally, but change the displayed label)
3. **Add `<LiveRooms />` at the top** of the `<TabsContent value="pitches">` section (before the "Incoming Requests" section)
4. **Remove the `<TabsContent value="meetings">` block** (lines 919-921) since its content (LiveRooms) is now in the pitches tab
5. **Update the grid columns** in the TabsList from `lg:grid-cols-9` to `lg:grid-cols-8` (one fewer tab)

### Result:
- One unified "Meetings" tab that shows Live Rooms at the top, followed by all pitch sections (Incoming Requests, Sent Requests, Upcoming Pitches, Past Pitches)
- No duplicate tabs, cleaner navigation
