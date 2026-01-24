
# Unify "New Mentorship Opportunities" UI Across Mentor and Advisor Dashboards

## Problem Identified

The Mentor Dashboard and Advisor Dashboard display the "New Mentorship Opportunities" section differently:

| Dashboard | Current Implementation | Styling |
|-----------|----------------------|---------|
| **Mentor Dashboard** | Uses `<MentorOffersBoard />` component | Premium tech-card glassmorphism with gradient borders, hover effects, accent lines |
| **Advisor Dashboard** | Inline custom implementation (lines 576-612) | Basic card list with simple borders, less visual polish |

This creates an inconsistent user experience between the two dashboards.

## Solution

Replace the inline "New Mentorship Opportunities" section in the Advisor Dashboard with the `MentorOffersBoard` component to ensure both dashboards share the same polished UI.

## Changes Required

### File: `src/pages/AdvisorDashboard.tsx`

**Step 1: Add MentorOffersBoard Import**
Add the import at the top of the file (around line 35):
```typescript
import MentorOffersBoard from '@/components/MentorOffersBoard';
```

**Step 2: Replace Inline Implementation**
Replace lines 576-612 (the "New Mentorship Opportunities" section) with:
```typescript
{/* New Opportunities - Using shared component */}
<MentorOffersBoard />
```

**Step 3: Remove Unused Code**
Since the Advisor Dashboard has its own `startups` state and `offerMentorship` function that are now handled by `MentorOffersBoard`, we can remove:
- The `fetchStartups` function (lines 279-317)
- The `startups` state (line 52)
- The `offerMentorship` function (lines 222-278)
- The related startup dialog state and handler code

## Visual Comparison

**Current AdvisorDashboard (inline):**
- Simple bordered cards in a vertical list
- Basic hover state with border color change
- No accent lines or gradient effects

**After Change (using MentorOffersBoard):**
- 3-column responsive grid layout
- Gradient accent line on left side of each card
- Glassmorphism backdrop blur effect
- Hover scale transform with glow shadow
- Gradient buttons with shadow effects
- "Looking for" badges display
- Dialog for adding mentorship goals/notes

## Technical Notes

1. `MentorOffersBoard` already handles:
   - Fetching available startups
   - Filtering out existing mentorship relationships
   - Real-time subscription for updates
   - Sending mentorship offers with goals and notes
   - Toast notifications for success/error states

2. Both Mentor and Advisor roles share the same mentorship logic (advisor is essentially a mentor variant), so the component works identically for both.

3. The `MentorOffersBoard` component is already imported and used in `MentorDashboard.tsx` line 194, confirming it's the intended shared component.
