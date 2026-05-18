# Startup Browser — visibility, ordering, and smart matching

Three connected fixes to the Startups subtab inside the Network area.

## 1. Show my own startup in the browser

Today, `StartupBrowser` excludes the logged-in user with `.neq('user_id', user.id)`, so a founder never sees their own startup card. We will:

- Remove the `.neq` filter so every platform startup loads.
- Tag the user's own company with a small "You" badge so it is clearly identifiable.
- Keep the existing legacy-vs-live dedup (legacy JSON entry is hidden when a live company with the same name exists), so the founder's real card replaces their legacy pipeline entry.

## 2. Platform-registered startups first, always

Order the grid so live, platform-registered companies render above any legacy pipeline cards, with the user's own startup pinned at the very top. Legacy entries still appear after, marked with the existing "Legacy" badge.

Resulting order:

```text
[ Your startup ]              <-- pinned
[ Other platform startups ]   <-- newest first
[ Legacy pipeline startups ]  <-- alphabetical
```

## 3. Smart matching section on top

Add a "Recommended for you" section above the full browse grid, scored against the viewer's profile (industry, stage, funding interest for investors; expertise for mentors/advisors). Up to 6 cards, each showing a match percentage and 1–2 reasons.

- Reuse the scoring logic already in `MatchingSystem.tsx` by extracting the investor/mentor scoring helpers into `src/lib/startupMatching.ts` so both components share one source of truth.
- The Recommended section only renders when the viewer has a role that produces scores and at least one live company scores above a threshold (e.g. 60).
- The full filterable grid below remains unchanged in behaviour.

Resulting layout inside the Startups subtab:

```text
[ Recommended for you (scored, top 6) ]
[ Browse all startups (filters + grid, ordered as in section 2) ]
```

## Sync clarification

The "data not syncing" symptom is the visibility bug in section 1 — the founder's live company exists in `companies`, but the browser filters it out. No schema change is needed; profile edits already flow through `companies` and render on the card.

## Technical notes

- `src/components/StartupBrowser.tsx`
  - Drop `neq('user_id', user.id)` in `fetchCompanies`.
  - Sort: own company → other live (by `created_at` desc) → legacy.
  - Add "You" badge when `company.user_id === user.id`.
  - Render a new `<RecommendedStartups>` block above the existing grid card.
- `src/lib/startupMatching.ts` (new)
  - Export `scoreCompanyForViewer(viewer, viewerRole, company) → { score, reasons }`.
  - Move the investor/mentor/advisor scoring branches from `MatchingSystem.tsx` here; have `MatchingSystem.tsx` import them so behaviour stays identical.
- Viewer profile fetch in `StartupBrowser`: load the viewer's role + relevant profile row (`investor_profiles`, `mentor_profiles`, etc.) once and memoise.
- No database migration. No RLS change.
