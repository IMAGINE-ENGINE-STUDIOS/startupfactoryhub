
# Village Rooms + Activity-First Tab Ordering

## Overview

This plan covers two major parts:
1. **Activity-First Tabs** — All tabs (including Meetings) sort content sections so widgets with real data always appear above empty/placeholder ones.
2. **Village Rooms** — 3 permanent, always-on virtual community rooms with a built-in democratic election system for host/moderator power.

---

## Part 1: Activity-First Tab Ordering

### Rule
Any collapsible section inside a tab that has real content (mentors, pitches, sessions, rooms, etc.) must render **before** empty sections. This applies across **all** Dashboard tabs, with special focus on the Meetings tab.

### Meetings Tab Changes (`src/pages/Dashboard.tsx`)
Currently sections are fixed in order:
- Rooms → Incoming Requests → Sent Requests → Upcoming Pitches → Past Pitches → Pending Offers → Active Mentors → Sessions

**New behavior**: Sort each group at render time so non-empty sections float to the top within their group:
- **Left column (Pitches)**: Sections with data render first, empty ones collapse to bottom
- **Right column (Mentorship)**: Same — Active Mentors before Pending Offers if mentors exist
- **Live Rooms section**: Village rooms (always active) show first, then user-created rooms

### How it works technically
We'll create a helper `sortByHasContent(sections)` that takes an array of `{ key, hasContent, element }` objects and returns them with content-first ordering. This keeps React rendering stable while achieving the activity-first UX.

---

## Part 2: Village Rooms System

### Concept
Three permanent, never-expiring community rooms — **The Plaza**, **The Commons**, **The Agora** — that always appear at the top of the Rooms section. These are special `village` category rooms with their own governance system.

### Village Room Characteristics
- Category: `village`
- Never expire (`expires_at = NULL` or year 2099)
- Always active (`is_active = true`)
- Cannot be deleted by users
- Have a dedicated `current_host_id` column
- Show a "Village" badge (purple/indigo) instead of "Live"

---

## Database Schema Changes

### 1. Alter `live_rooms` table — add new columns

```sql
ALTER TABLE public.live_rooms 
  ADD COLUMN IF NOT EXISTS room_category TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS current_host_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS host_elected_at TIMESTAMPTZ;
```

### 2. New `village_elections` table

```sql
CREATE TABLE public.village_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active | concluded | recalled
  started_at TIMESTAMPTZ DEFAULT now(),
  concluded_at TIMESTAMPTZ,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. New `village_votes` table

```sql
CREATE TABLE public.village_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.village_elections(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id),
  candidate_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, voter_id)
);
```

### 4. Seed the 3 Village Rooms with real Whereby links
The 3 villages will be inserted as permanent rows in `live_rooms` with `room_category = 'village'`, `expires_at = '2099-01-01'`, and the existing Whereby meeting links already created (Plaza room exists with link `startupfactoryhub.whereby.com/plaza...`).

---

## New Files to Create

### `src/components/VillageRooms.tsx`
The Village Rooms section UI showing the 3 permanent rooms. Features:
- Distinctive card design with indigo/purple gradient + "Village" badge
- Shows current host avatar + name if one has been elected
- Participant count
- "Join" button → opens VideoMeetingDialog
- "Call Election" button (shown to any participant inside the room)
- Election status indicator ("Election in Progress", "Awaiting Votes")

### `src/components/VillageElectionPanel.tsx`
A panel/dialog that shows when an election is active for a Village room:
- Lists all current participants as candidate options
- Each participant casts exactly one vote (radio selection)
- Submit vote button (disabled after voted)
- Live vote tally dashboard (hidden until all have voted OR election is recalled)
- Shows result: Winner announced if >2 votes, or "No winner — recalling election" if tied

### `src/hooks/useVillageElections.ts`
Hook managing:
- `fetchActiveElection(roomId)` — get current active election
- `castVote(electionId, candidateId)` — upsert vote
- `callElection(roomId)` — create new election, invite all current participants
- `checkElectionResult(electionId)` — tally votes, determine winner (>2 votes threshold), update room host or recall election
- Real-time subscription on `village_votes` and `village_elections`

---

## Election Rules (Implemented in Logic)

```text
Election Called
    → All room participants are asked to vote
    → Each person votes once (one person = one vote)
    
After all participants have voted:
    → Count votes per candidate
    → If winner has > 2 votes → winner becomes Host
    → If no candidate has > 2 votes → results shown, election auto-recalled
    → Loop until host is chosen

Host Powers:
    → Only applies to Village rooms
    → Can mute/spotlight (Whereby host controls via hostRoomUrl if available)
    → Shown as "Host" badge on their profile in the room card
    → Powers reset when new election is called and they lose
```

---

## Component Integration

### `src/components/LiveRooms.tsx` — Updated
- Import and render `<VillageRooms />` at the **top** of the section, before user-created rooms
- The village section has its own header "Community Villages"
- Regular user-created rooms appear below in "Live Rooms"

### `src/pages/Dashboard.tsx` — Meetings Tab
- Add activity-sort logic for collapsible sections
- Village rooms (via LiveRooms component update) automatically appear first

---

## Technical Approach for Activity Sorting

For each tab section that uses `Collapsible`, we define whether it "has content" at render time and sort using a simple pattern:

```typescript
// Example for Meetings tab pitch sections
const pitchSections = [
  { key: 'incoming', hasContent: incomingCount > 0, element: <IncomingSection /> },
  { key: 'sent', hasContent: sentCount > 0, element: <SentSection /> },
  { key: 'upcoming', hasContent: upcomingCount > 0, element: <UpcomingSection /> },
  { key: 'past', hasContent: pastCount > 0, element: <PastSection /> },
].sort((a, b) => Number(b.hasContent) - Number(a.hasContent));
```

This is pure UI sorting — no data changes, no API calls.

---

## Summary of Files Changed

| File | Action | What Changes |
|---|---|---|
| `src/pages/Dashboard.tsx` | Edit | Activity-sort for Meetings tab pitch & mentor sections |
| `src/components/LiveRooms.tsx` | Edit | Render VillageRooms at top, user rooms below |
| `src/hooks/useLiveRooms.ts` | Edit | Filter: `room_category != 'village'` for regular rooms |
| `src/components/VillageRooms.tsx` | Create | Village room cards with election UI entry point |
| `src/components/VillageElectionPanel.tsx` | Create | Full election voting + results dashboard |
| `src/hooks/useVillageElections.ts` | Create | Election state, voting, result calculation |
| DB Migration | Create | Add columns + new tables + seed 3 village rooms |

---

## Village Room Visual Design

Each Village room card will have:
- Gradient top border: indigo-to-violet
- "Village" badge with a crown icon
- If host elected: gold "Host" chip with avatar
- If election active: pulsing orange "Election Live" badge
- Permanent rooms show no expiry timer

The Election Panel will open as a bottom sheet dialog showing candidates (participants) as avatar + name cards with radio selection, a live progress bar for votes received vs total participants, and final results in a clean bar chart style.
