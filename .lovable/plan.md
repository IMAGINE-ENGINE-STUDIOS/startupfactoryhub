

## Goal
Add a "Previous Events" / news strip to the Events & Collaborations slide in `src/pages/Brochure.tsx` showcasing 6 past events with the uploaded photos.

## Exploration needed
- Read the Events & Collaborations section in `src/pages/Brochure.tsx` to find where to insert the new strip (likely after "Cases of Success", before the upcoming banner — or as a new compact row).
- Confirm available vertical space on the A4 page.

## Changes — `src/pages/Brochure.tsx`

### 1. Copy uploaded photos to assets
- `user-uploads://1745536534442.jpg` → `src/assets/event-voyager-osu.jpg` (Voyager Technologies @ Ohio State)
- `user-uploads://1767807258904.jpg` → `src/assets/event-launching-orlando.jpg` (Launching Party Orlando)
- `user-uploads://1758778387323.jpg` → `src/assets/event-lake-county.jpg` (Lake County Mayor + UCF Incubation)
- `user-uploads://1772822409222.jpg` → `src/assets/event-plug-and-play.jpg` (Plug and Play Selection Day)

NASA Technology Transfer events (2 entries) → no photo, render as gradient placeholder cards with NASA-themed styling.

### 2. Add "Previous Events" strip
Insert a new compact section on the Events & Collaborations slide, **below "Cases of Success"** and **above the upcoming events banner**.

Layout: horizontal row of 6 small event cards (`grid-cols-6 gap-2`), each ~80–90px tall:
- Photo thumbnail on top (or gradient placeholder for NASA Hot Deals)
- Tiny title underneath (`text-[9px]` font-semibold, 2-line clamp)
- Subtle border + dark overlay for legibility

Header above strip: small "Previous Events" label with an icon (`History` or `Calendar` from lucide-react), styled like "Cases of Success" header (`text-[12px]` tracked uppercase).

The 6 cards in order:
1. Voyager Technologies @ Ohio State (photo)
2. Launching Party Orlando (photo)
3. NASA Tech Transfer — R&D Acceleration (placeholder, NASA blue gradient)
4. Lake County Gov + UCF Incubation (photo)
5. Plug and Play Selection Day (photo)
6. NASA Tech Transfer — Hot Deals (placeholder, NASA blue gradient, marked "missing photo")

### 3. Space management
To fit on A4: tighten the existing "Cases of Success" section padding slightly (`p-4` → `p-3`, `h-16` → `h-14`) only if needed after testing. Otherwise leave it untouched.

## What stays the same
- All other slides
- Cases of Success layout (Spacely, Copernic, Woman Aero, Korb)
- Upcoming events banner
- Partnership Models, Strategic Benefits, etc.

## Files touched
- `src/pages/Brochure.tsx` (edit)
- `src/assets/event-voyager-osu.jpg` (new)
- `src/assets/event-launching-orlando.jpg` (new)
- `src/assets/event-lake-county.jpg` (new)
- `src/assets/event-plug-and-play.jpg` (new)

