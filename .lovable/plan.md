

# Restrict DJ Deck to ceo@imagineengine.space Only

## Problem
The DJ Deck button and console are visible to all users on the Hot Deals portal. Only `ceo@imagineengine.space` should see and control it.

## Changes

### 1. `src/pages/HotDealsPortal.tsx`
- Import `useAuth` from AuthContext
- Get the current user's email
- Define a constant: only `ceo@imagineengine.space` is the DJ admin
- Conditionally render the "DJ DECK" button and `DJMicrophone` component only when the logged-in user's email matches
- The `{showDJ && <HotDealsDJConsole />}` block is already gated behind the button, so hiding the button is sufficient

### 2. `src/hooks/useDJBroadcast.ts`
- Update `ADMIN_EMAILS` to only contain `ceo@imagineengine.space` (remove `demo-admin@startupfactoryhub.com`)
- This ensures broadcast control is restricted server-side as well

### Audio Engine (no changes needed)
- `DJAudioEngine` is the **listener** component — it plays the broadcast audio for ALL users. This stays unchanged so everyone hears the music and announcements controlled by the DJ admin.

## Technical Details
- The DJ button (lines 102-113 in HotDealsPortal.tsx) will be wrapped in a conditional check: `user?.email === 'ceo@imagineengine.space'`
- The `DJMicrophone` component (line 55) will also be gated behind the same check
- The `showDJ` state and DJ console rendering block (line 153) are naturally gated since the button won't be clickable

