
## Fixing SFH MVP Accelerator Admin Manager

### Problems Found

Three distinct issues were identified through code and database analysis:

---

### Issue 1 — Profile Save is Silently Blocked by RLS

The `accelerator_profiles` table has a Row Level Security (RLS) policy:
```
Users can manage their own accelerator profile: auth.uid() = user_id
```

The SFH profile is owned by user `45b54179-...` (the SFH account). When an admin logs in and tries to save the profile, their `auth.uid()` does NOT match that `user_id`, so the UPDATE is silently dropped — no error, 0 rows changed, but Supabase reports success.

**Fix:** Add a new RLS policy that also allows users with the `admin` role to update any accelerator profile. This uses the existing `has_role()` database function.

---

### Issue 2 — "View Details" Button on Cohorts is Disconnected

In `CohortManagement`, clicking "View Details" calls `onSelectCohort(cohort)`, which sets the `selectedCohort` state in `SFHAcceleratorManager`. However, **nothing renders based on `selectedCohort`** — there is no drawer, modal, or detail panel wired up to it. The button is a dead end.

**Fix:** Add a `CohortDetailSheet` (slide-over panel) inside `SFHAcceleratorManager` that opens when `selectedCohort` is set. It will display full cohort details and allow editing the cohort's status, dates, and description directly.

---

### Issue 3 — Applications List Does Not Refresh Properly

`SFHApplicationsViewer` only re-fetches when the `cohorts` prop reference changes. When `onRefresh()` is called (after accepting/rejecting), `fetchData()` re-runs in the parent but the applications list doesn't re-query because `cohorts` hasn't changed identity.

**Fix:** Add a `refreshKey` counter in `SFHAcceleratorManager` that increments on `onRefresh`, and pass it as a prop to `SFHApplicationsViewer` so its `useEffect` actually fires again.

---

### Changes Required

#### 1. Database Migration — New RLS Policy for Admin Writes

```sql
-- Allow admins to update any accelerator profile
CREATE POLICY "Admins can manage all accelerator profiles"
ON public.accelerator_profiles
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

This uses the existing `has_role()` security-definer function already in the database, so no new infrastructure is needed.

#### 2. Modify `src/components/admin/SFHAcceleratorManager.tsx`

- Add a `refreshKey` state (number) that increments when `fetchData()` completes. Pass it to `SFHApplicationsViewer` so its `useEffect` dependency triggers correctly.
- Wire up the `selectedCohort` state: add a `Sheet` component (slide-over) that opens when `selectedCohort !== null`. Inside it, show cohort details and provide an inline form to edit status, dates, funding, and description, calling `handleUpdateCohort` on save.
- Remove the now-unused `selectedCohort` dead-end.
- Add a "Close" / "X" button to dismiss the cohort detail sheet by setting `selectedCohort` back to null.
- In `SFHApplicationsViewer`, add `refreshKey` to the `useEffect` dependency array so re-fetching works.

---

### Files to Create/Modify

| File | Action | What Changes |
|---|---|---|
| Database migration | **Create** | Add admin RLS policy on `accelerator_profiles` |
| `src/components/admin/SFHAcceleratorManager.tsx` | **Modify** | Fix refresh key, wire up cohort detail sheet, fix disconnected selectedCohort |
