## Goal
Replace the 5 sub-tabs in the Connections section (Mentors / Investors / Accelerators / Startups / Network) with **one unified list** that:
- Shows all user types in a single feed
- Sorts results by relevance to the current user's role
- Has a compact filter row (chips) to narrow by profile type
- Uses a smaller, more compact search bar

## Scope
- `src/components/MatchingSystem.tsx` — replace the `<Tabs>` block (lines ~1198–1413) with a single unified view.
- `src/components/NetworkSearchEngine.tsx` — slim down the UI (smaller card, single line, no big empty state).

No DB or business-logic changes. Existing fetch hooks (`mentorMatches`, `investorMatches`, `acceleratorMatches`, `startupMatches`, `potential*`) stay; we just merge them into one array.

## New UX

```text
┌─────────────────────────────────────────────────────────────┐
│ 🔍  Search people, companies, industries…           [×]     │  ← compact search (h-9)
└─────────────────────────────────────────────────────────────┘
[ All ] [ Mentors ] [ Investors ] [ Startups ] [ Accelerators ] [ My Network ]
   ↑ chip row, single-select, horizontally scrollable on mobile

┌─ Recommended for you ───────────────────────────────────────┐
│ • Card • Card • Card • Card  (grid, 2 cols md, 1 col sm)    │
└─────────────────────────────────────────────────────────────┘
```

### Relevance ordering
Merge all matches into one list, then sort by:
1. Items whose `role` matches the role most relevant to the current user (e.g. a **startup** user sees investors → mentors → accelerators → other startups first; an **investor** sees startups → mentors → …; mentor sees startups → mentors; etc.).
2. Within each role bucket, keep existing match-score order.
3. Filter chip narrows the list to the selected role; "My Network" chip switches to the existing `<NetworkBrowser />` view.

A small helper `getRolePriority(currentRole, targetRole)` returns a number used in `Array.sort`.

### Filter chips
- Implemented as `Button` variants (`default` when active, `outline` when inactive), wrapped in a `flex gap-2 overflow-x-auto` row.
- State: `const [filter, setFilter] = useState<'all'|'mentor'|'investor'|'startup'|'accelerator'|'network'>('all')`.
- No `<Tabs>` component — just controlled state driving which array gets rendered.

### Search
Keep `NetworkSearchEngine` logic, but:
- Reduce card padding (`pt-3 pb-3`), remove the large "Find users…" empty state, remove the search-icon empty state placeholder.
- Input height `h-9`, smaller placeholder text.
- Results dropdown unchanged.

## Files changed
1. `src/components/MatchingSystem.tsx` — replace the Tabs block with unified list + chip filter.
2. `src/components/NetworkSearchEngine.tsx` — compact styling only.

## Out of scope
- No changes to matching algorithm, data fetches, or connection-request flow.
- No changes to `NetworkBrowser` (reused as-is under the "My Network" chip).
- No changes to other dashboards' connection widgets.
