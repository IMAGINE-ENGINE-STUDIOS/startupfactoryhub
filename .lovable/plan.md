

# Persistent Video Rooms - Updated Implementation

## Summary
Only **future** events, meetings, and pitches will have their room URLs refreshed. Past events are left unchanged since there's no need to regenerate expired links for events that have already happened.

---

## Current Future Items Needing Persistent Rooms

| Type | Count | Details |
|------|-------|---------|
| **Virtual Events** | 1 | "Hot deals in the Space Industry" - March 16, 2026 |
| **Pitch Meetings** | 1 | Pending pitch - January 31, 2026 |
| **Mentoring Sessions** | 0 | None scheduled in the future |
| **Live Rooms** | 0 | None currently active (expire by design) |

---

## Implementation Plan

### Phase 1: Database Schema Update
Add a column to store persistent room URLs for events:

```sql
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS meeting_room_url TEXT;
```

---

### Phase 2: Edge Function Update (`create-whereby-room`)
Change default expiration from 24 hours to **10 years**:

**Before:**
```javascript
endDate: endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
```

**After:**
```javascript
const tenYearsFromNow = new Date();
tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);
endDate: endDate || tenYearsFromNow.toISOString()
```

---

### Phase 3: VideoConferencing Component Update
Add new props to support persistent rooms:

```typescript
interface VideoConferencingProps {
  persistentRoomUrl?: string;           // Stored room URL from database
  onRoomCreated?: (url: string) => void; // Callback when new room is created
  // ... existing props
}
```

**Logic change:**
1. If `persistentRoomUrl` is a valid Whereby URL → use it directly
2. If not → create new room via API → call `onRoomCreated(newUrl)`

---

### Phase 4: EventDetailsDialog Update
- Fetch event's `meeting_room_url` when dialog opens
- Pass to VideoConferencing as `persistentRoomUrl`
- Save new URL to `events.meeting_room_url` via `onRoomCreated` callback

---

### Phase 5: CreateEventDialog Update
- When creating virtual events, store room URL in `meeting_room_url` column
- Use 10-year expiration for newly created rooms

---

### Phase 6: Refresh Future Items (One-Time)
Regenerate room URLs only for **future** items:

**Future Virtual Events (1):**
```sql
UPDATE public.events 
SET meeting_room_url = [new_whereby_url]
WHERE id = '07975984-c47d-45f6-96c1-c2d6bd750db8';  -- Hot deals event
```

**Future Pitch Meetings (1):**
```sql
UPDATE public.pitch_meetings
SET meeting_link = [new_whereby_url]  
WHERE id = '8260e113-49ce-424e-aeba-47804ab54f43';  -- Jan 31 pitch
```

**Past items:** No changes needed - left as-is.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/create-whereby-room/index.ts` | Change default expiration to 10 years |
| `src/components/VideoConferencing.tsx` | Add `persistentRoomUrl` and `onRoomCreated` props |
| `src/components/EventDetailsDialog.tsx` | Fetch/save `meeting_room_url`, pass to VideoConferencing |
| `src/components/CreateEventDialog.tsx` | Store room URL in `meeting_room_url` column |

---

## User Flow After Implementation

```text
FIRST PARTICIPANT JOINS:
├── Has meeting_room_url? 
│   ├── YES → Join existing room
│   └── NO → Create new room (10-year expiry) → Save to database
└── All future participants join SAME room

PAST EVENTS:
└── Unchanged - no regeneration needed
```

---

## Benefits
- **Only future events refreshed** - No wasted API calls on past events
- **Same room for everyone** - All participants join identical meeting
- **10-year expiration** - Rooms effectively never expire
- **Works with upgraded Whereby** - No limits with paid subscription

