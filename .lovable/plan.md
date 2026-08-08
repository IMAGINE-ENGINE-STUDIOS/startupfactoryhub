# Fix accelerator program cards in the feed

## What's wrong today

Accelerator program posts in the community feed store a full application link **at the moment the post is created**, using whatever address the browser was on. One of the two existing posts in the database was created from a temporary sandbox address (`...lovableproject.com`), so its "open application" link now leads to a dead page. The "Apply Now" button also does nothing useful for visitors who aren't signed in.

The card layout is also uneven: the detail chips (days left, funding, equity, fee) wrap into ragged rows depending on how many exist, the action row mixes a stretched button with two small square buttons, and the header/banner block adds an empty gradient strip.

## What will change

**1. Links always work**

- Every link is rebuilt at display time from the program's ID (`/cohorts/<id>/apply`) instead of trusting the stored address. Stored addresses are only used when they point to a genuine external site (a real accelerator's own form), never when they point at an old preview/sandbox address.
- Clicking the card title, the banner, or "Apply Now":
  - Signed-in startup users: opens the in-platform application form (existing dialog), same as today.
  - Everyone else / "View application page": navigates in the same tab to the platform's public application page for that program.
- The "open in new tab" and "copy link" buttons both use the corrected canonical link, so copied links are shareable and always land on the real application page.
- If a program has no valid ID, the action buttons are disabled with a short explanation rather than silently doing nothing.

**2. Symmetric design**

- Detail chips become a fixed, even grid (2 columns on mobile, 4 on desktop) with equal-height tiles, so the block looks balanced whether 1 or 4 details exist.
- Missing values render as neutral placeholder tiles instead of collapsing the row.
- Action row becomes two equal-width buttons ("Apply Now" and "View Application Page") plus one icon button for copy, aligned on a single baseline and stacking cleanly on mobile.
- Removes the empty gradient strip; the avatar, title and metadata align on a consistent left edge with uniform padding.
- Keeps the existing glassmorphic `tech-card` treatment, emerald accent and Lucide icons — no emojis, no new colors.

**3. New posts stop baking in bad links**

Where accelerator program posts are created (accelerator dashboard and the SFH accelerator admin manager), the stored link becomes a relative path (`/cohorts/<id>/apply`) instead of an absolute address tied to the current browser origin.

## Technical notes

- `src/components/CohortPostCard.tsx`: resolve `applicationUrl` via a helper that prefers `cohort_id` and only honors `application_url` when its host is not a `lovableproject.com` / `id-preview--*.lovable.app` origin; use `react-router` `navigate()` for in-app navigation, `window.open` only for genuine external URLs. Restructure the chips into `grid grid-cols-2 sm:grid-cols-4 gap-2` with `items-stretch`, and the CTAs into `grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2`.
- `src/hooks/useAcceleratorProfile.ts` (~line 243) and `src/components/admin/SFHAcceleratorManager.tsx` (~line 270): change `application_url` to the relative path.
- Backfill: one existing post (`9bb3f89c-…`) holds a stale sandbox URL. The display-time fix already neutralizes it; optionally a small migration rewrites both rows' `application_url` to the relative path for cleanliness.
- No schema changes required. `/cohorts/:cohortId/apply` already exists and `accelerator_cohorts` is publicly readable, so the target page works for logged-out visitors.
