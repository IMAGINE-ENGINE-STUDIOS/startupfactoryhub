
# Persistent Video Rooms for Events

## Summary
Since you've upgraded your Whereby subscription, we can create long-lasting meeting rooms that work for events. The current system creates a **new room every time someone clicks "Join"**, which means:
- Different participants may end up in different rooms
- The room link changes each time

We'll fix this so:
1. **One room per event** - Created once and saved to the database
2. **Very long expiration** - Set to 10 years so it effectively never expires
3. **All participants join the same room** - The saved URL is reused

---

## What Will Change

### 1. Edge Function Update
Modify `create-whereby-room` to set rooms to expire in **10 years** instead of 24 hours when no end date is provided.

### 2. VideoConferencing Component
Change the join logic to:
- **First** check if a valid room URL already exists in the database for this event
- **Only create a new room** if none exists or if explicitly told to regenerate
- **Save the new room URL back** to the database after creating it

### 3. Event Room Storage
Add a new `meeting_room_url` column to the `events` table to store the **active Whereby room URL** separately from the placeholder location field.

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS "JOIN MEETING"                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│        Check: Does event have a stored meeting_room_url?        │
└─────────────────────────────────────────────────────────────────┘
                 │                           │
                YES                          NO
                 │                           │
                 ▼                           ▼
┌────────────────────────┐     ┌────────────────────────────────┐
│   Use existing room    │     │  Create new room (10yr expiry) │
│   URL directly         │     │  Save URL to database          │
└────────────────────────┘     └────────────────────────────────┘
                 │                           │
                 └───────────┬───────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              All participants join the SAME room               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Database Migration
Add a column to store the persistent room URL:
```sql
ALTER TABLE public.events 
ADD COLUMN meeting_room_url TEXT;
```

### Edge Function Changes (`create-whereby-room`)
- Change default expiration from 24 hours to **10 years**
- This ensures rooms practically never expire

### VideoConferencing Component Changes
- Add `onRoomCreated` callback prop to notify parent when a new room is created
- Check if `roomUrl` prop is a valid Whereby URL before creating new
- Use existing URL if available, create new only if needed

### EventDetailsDialog Changes
- After room is created for the first time, save it to the event's `meeting_room_url` field
- Pass this URL to VideoConferencing component

### CreateEventDialog Changes
- When creating online events, set very long expiration (event end date + 10 years as buffer)
- Store the room URL in `meeting_room_url` field

---

## Benefits
- **Same room for everyone** - All event attendees join the identical meeting
- **Links never expire** - 10-year expiration means the link works whenever the event starts
- **Works with your upgraded Whereby** - No API limits on room duration with paid plans
- **Backward compatible** - Existing events will get new persistent rooms on first join

