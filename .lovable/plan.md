

# Hot Deals Portal Updates

## Changes

### 1. Replace all Lucide icons with 🔥 emoji
Remove all Lucide icon imports (Flame, Radio, Share2, Copy, Check, Mail, MessageCircle, Trophy, ExternalLink) from HotDealsPortal, HotDealsVoting, HotDealsStartupProfiles, and HotDealsWinner. Replace every icon usage with the 🔥 emoji (fire only, no other icons). Keep ArrowLeft for the back button as it's functional navigation.

### 2. Full orange theme enforcement
Already mostly orange. Ensure any remaining green references (e.g., `text-green-400` for "✓ Voted" and WhatsApp icon) are changed to orange.

### 3. Show 5 empty startup cards below the video conference
Move startup cards directly below the Whereby room (before voting). Show 5 placeholder cards when no startups are registered — each showing "Startup #1" through "Startup #5" with an empty fire-themed placeholder. When startups register, their real data replaces the placeholders. Integrate voting (1-5 fires) directly into each card.

### 4. Restructure layout: Video → Startup Cards with Voting → Sidebar widgets
- Whereby room (full width)
- 5 startup cards with integrated voting (full width, grid)
- Two-column below: left = Agenda, right = 3D models + Arcade + Partners

### 5. Slow down the arcade games
Pass a `speedMultiplier={0.5}` prop concept — but since we can't easily modify all 4 game components, we'll wrap SpaceArcade in a CSS `animation-duration` slowdown won't work for canvas. Instead, add a note/TODO, or reduce game loop speed. Simpler: the games use `setInterval` with timing — we can adjust the interval in each game. Actually, let me check if SpaceArcade accepts any props... It doesn't. We'll add a `slow` prop to SpaceArcade that passes to each game component, and in each game, multiply the interval delay by 2x.

### 6. Add Agenda section with admin password editing
Create a new `HotDealsAgenda` component:
- Displays a list of agenda items (time + title + description)
- Stores agenda in a new `hot_deals_agenda` table (id, time_slot, title, description, sort_order)
- Has an "Edit Agenda" button that prompts for password `StartupFactoryHot`
- When authenticated, shows inline editing (add/edit/delete agenda items)
- Password check is client-side only (simple prompt comparison)
- Default agenda items: Welcome, Startup Pitches (5 slots), Voting, Winner Announcement

### Database: New table `hot_deals_agenda`
- `id` uuid PK
- `time_slot` text (e.g., "2:00 PM")
- `title` text
- `description` text nullable
- `sort_order` integer
- RLS: public read, public insert/update/delete (admin password is client-side gate)

## Files

### New
- `src/components/HotDealsAgenda.tsx` — Agenda display + admin edit mode

### Modified
- `src/pages/HotDealsPortal.tsx` — restructure layout, remove icons, add agenda
- `src/components/HotDealsVoting.tsx` — remove Flame icon, use 🔥 only, merge with startup cards
- `src/components/HotDealsStartupProfiles.tsx` — show 5 placeholder cards, remove ExternalLink icon
- `src/components/HotDealsWinner.tsx` — remove Trophy icon, use 🔥
- `src/components/SpaceInvadersGame.tsx` — slow game speed 2x
- `src/components/AsteroidDodgerGame.tsx` — slow game speed 2x
- `src/components/SpacePacmanGame.tsx` — slow game speed 2x
- `src/components/LunarLanderGame.tsx` — slow game speed 2x

### Migration
- Create `hot_deals_agenda` table with default seed data

