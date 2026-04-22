

## Goal

Add a **Help (?)** button to the top-right toolbar that launches an **interactive, arrow-driven product tour**. The tour walks the user through the platform's core flows: Profile → Posting → Creating Events → Creating a Meeting → Resources Map, plus role-specific extras.

## What gets built

### 1. New button in `DashboardHeader`
- Add a `HelpCircle` icon button next to the existing Profile/Home buttons (same pill style, 9x9 rounded, glass background).
- Clicking it dispatches a global `start-tour` event (and sets `localStorage.tour.requested = true`) so the tour overlay can pick it up from any page.
- Tooltip: "Take the tour".

### 2. New component `InteractiveTour`
A single global overlay component, mounted once in `App.tsx` (right next to `FloatingChat`), so it works on every authenticated route.

Behavior:
- Listens for the `start-tour` event.
- Renders a **fixed full-screen overlay** with:
  - A **dimmed backdrop** (`bg-black/60 backdrop-blur-sm`) with a **transparent cut-out spotlight** around the current target element (using a CSS `box-shadow: 0 0 0 9999px rgba(0,0,0,0.7)` ring trick, plus a glowing `ring-2 ring-primary` outline on the target).
  - An **animated arrow** (lucide `ArrowDown` / `ArrowUp` / `ArrowLeft` / `ArrowRight`) positioned next to the target, with a gentle bounce animation pointing at it.
  - A **tooltip card** (glass-morphism, `max-w-sm`) anchored near the target containing: step title, short description, step counter (e.g. `3 / 9`), and three buttons: **Back**, **Skip tour**, **Next** (last step shows **Finish**).
- Smart positioning: measures target via `getBoundingClientRect()`, picks the side with the most space, scrolls the target into view (`scrollIntoView({ block: 'center' })`) before showing.
- Recomputes position on `resize` / `scroll`.
- If a target is missing (e.g. not on current page), it auto-navigates to the right route, waits ~600 ms for mount, retries up to 3 times, then skips that step gracefully.
- Pressing **Esc** or clicking the backdrop ends the tour. Tour state is kept in component state + persisted to `localStorage` (`tour.completed = true` after Finish, so we know who's done it).

### 3. Tour steps (role-aware)

Each step = `{ id, route, selector, title, description, side }`.

Common steps (all roles):
1. **Welcome** — centered modal, no target. "Let's take a quick tour."
2. **Your profile** — points to the Profile button in `DashboardHeader`. "Edit your bio, avatar and skills here."
3. **Notifications & recommendations** — points to the Brain/Bell buttons. "We surface matches and updates here."
4. **Community feed / Posting** — switches to the `social` tab and points to the post composer. "Share an update with the community."
5. **Events** — switches to the `events` tab (or equivalent) and points to the **Create Event** button. "Host an event in two clicks."
6. **Meetings / Calendar** — switches to the `calendar` tab and points to the **Create Session / New Meeting** button.
7. **Network browser** — points to the network tab. "Find mentors, investors, startups."
8. **Resources Map** — navigates to `/4d-map`. "Explore global resources, hubs and live opportunities."
9. **Floating chat (Genius AI)** — points to the floating chat button. "Ask Genius anything, anytime."
10. **Finish** — centered card. "You're set. You can replay this tour any time from the Help button."

Role extras (appended automatically):
- Startup → **Startup roadmap** + **Investor network**.
- Mentor / Advisor → **Availability manager** + **Bookings**.
- Investor → **Pitch inbox**.
- Accelerator → **Cohorts** + **Applications**.
- Student → **Educational resources**.

Detection uses `useUserRole()` inside `InteractiveTour`.

### 4. Target hooks (data attributes)
To keep selectors stable, add `data-tour="<id>"` attributes on the relevant existing elements:
- `data-tour="profile-button"` on the Profile button in `DashboardHeader`.
- `data-tour="notifications"` / `data-tour="recommendations"` on those buttons.
- `data-tour="tab-social"`, `data-tour="tab-events"`, `data-tour="tab-calendar"`, `data-tour="tab-network"` on the relevant `TabsTrigger`s in each dashboard (Student, Mentor, Advisor, Investor, Startup, Accelerator).
- `data-tour="create-event"` on the Create Event button.
- `data-tour="create-meeting"` on the Create Session button.
- `data-tour="floating-chat"` on the FloatingChat trigger.
- `data-tour="help-button"` on the new Help button itself (used for the closing step).

These are pure attributes — no visual or behavior change to existing components.

### 5. Auto-prompt for new users (optional, off by default)
Not added now. The Help button is the only entry point so we don't disturb existing users. We can add an "auto-start on first login" flag later if you want.

## Files

**New:**
- `src/components/InteractiveTour.tsx` — the overlay, spotlight, arrow, tooltip card, navigation logic.
- `src/lib/tourSteps.ts` — exported `getTourSteps(role)` returning the ordered step list.

**Edited:**
- `src/components/DashboardHeader.tsx` — add Help button + `data-tour` attributes on existing buttons.
- `src/App.tsx` — mount `<InteractiveTour />` once globally (inside `BrowserRouter`, alongside `FloatingChat`).
- Each dashboard page that has tabs (`StudentDashboard`, `Dashboard`, `MentorDashboard`, `AdvisorDashboard`, `InvestorDashboard`, `AcceleratorDashboard`) — add `data-tour="tab-…"` to the relevant `TabsTrigger`s and `data-tour="create-…"` on the relevant create buttons. No layout/visual changes.
- `src/components/FloatingChat.tsx` — add `data-tour="floating-chat"` on the trigger.

## Visual details (matches existing design system)

- Backdrop: `fixed inset-0 z-[100]` dark dim with blur.
- Spotlight ring on target: `ring-2 ring-primary shadow-glow rounded-md` plus oversized box-shadow for the cut-out.
- Tooltip card: existing glass-morphism style, `border border-ocean-border`, `bg-background/95 backdrop-blur`, primary-accented title, `text-sm` body.
- Arrow: lucide icon, `text-primary`, `animate-bounce` (or a custom slow bounce), positioned 12 px from target on the chosen side.
- No emojis, professional aesthetic — per project conventions.

## Out of scope

- No analytics tracking of tour progress in this iteration.
- No video/voiceover.
- No translation strings yet (English only) — we can wire it through `LanguageContext` in a follow-up.

