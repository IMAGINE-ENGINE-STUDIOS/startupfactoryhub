
## Admin: Startup Factory Hub MVP Accelerator Management

### Overview

The goal is to add a dedicated admin panel section that lets admins manage the **Startup Factory Hub - MVP Accelerator** program. This is a special "platform-owned" accelerator profile (already exists in the DB as `Startup Factory HUB` with ID `abd41d15-f707-4e36-b2f5-3a08d7b7b13a`). The admin section reuses the same data model as regular accelerators but provides an admin-specific management UI, plus an "External Link" field for the program's public landing page.

---

### What Exists Already

- `accelerator_profiles` table: has a row for "Startup Factory HUB" owned by user `45b54179-...`
- `accelerator_cohorts` table: linked by `accelerator_id`
- `CohortManagement` component: reusable cohort management UI
- `CreateCohortDialog`: create cohorts
- `CohortApplicationsManager`: manage startup applications
- `AlumniPortfolio`, `StartupJourneyTracker`, `MentorAdvisorAssignment`: all reusable from AcceleratorDashboard
- Admin Dashboard already has a tab slot system

---

### Changes Required

#### 1. Database Migration — Add `external_link` to `accelerator_profiles`

Add an `external_link` column (text, nullable) to `accelerator_profiles` to store an external URL for the program (e.g., a landing page or registration form outside the platform).

```sql
ALTER TABLE public.accelerator_profiles
ADD COLUMN IF NOT EXISTS external_link text;
```

#### 2. New Component: `src/components/admin/SFHAcceleratorManager.tsx`

A self-contained admin management panel for the SFH MVP Accelerator program. It will:

- **Hardcode the SFH accelerator profile ID** (`abd41d15-f707-4e36-b2f5-3a08d7b7b13a`) to always target the correct record — no user-level auth required.
- **Profile Editor section**: Edit `organization_name`, `description`, `website`, `external_link`, `program_duration`, `equity_percentage`, `funding_offered`, `is_accepting_applications`, `logo_url`, `location`.
- **External Link Manager**: A prominent card showing the current external link with a copy button and "Open" button.
- **Cohort Management**: Reuse `CohortManagement` + `CreateCohortDialog` components to create and view cohorts linked to the SFH accelerator.
- **Applications viewer**: Show all `cohort_applications` for SFH cohorts.
- **Portfolio viewer**: Show all `cohort_startups` for SFH cohorts.
- **Stats cards**: Total cohorts, total startups, total applications, accepting status.

Component structure (tabs within the panel):
```text
SFHAcceleratorManager
├── Overview Tab (profile info + stats + external link)
├── Cohorts Tab (CohortManagement component)
├── Applications Tab (CohortApplicationsManager)
└── Portfolio Tab (StartupJourneyTracker / portfolio list)
```

#### 3. Update Admin Dashboard (`src/pages/AdminDashboard.tsx`)

- Add a new tab `"sfh-program"` with icon `Rocket` and label `"MVP Program"`.
- Import and render `<SFHAcceleratorManager />` inside the new `TabsContent`.

---

### Data Flow

```text
Admin opens "MVP Program" tab
        ↓
SFHAcceleratorManager loads
        ↓
Queries accelerator_profiles WHERE id = 'abd41d15-...'  (hardcoded SFH ID)
        ↓
Queries accelerator_cohorts WHERE accelerator_id = SFH_ID
        ↓
Queries cohort_applications WHERE cohort_id IN [sfh cohort ids]
        ↓
Queries cohort_startups WHERE cohort_id IN [sfh cohort ids]
        ↓
Admin can edit profile fields, manage cohorts, review applications, manage portfolio
```

---

### Technical Details

- **No new auth needed**: Admin role is already validated at the AdminDashboard level — the component trusts that only admins can reach it.
- **SFH Profile ID is a constant**: Defined at the top of the component for easy future updates.
- **External Link**: Stored in `external_link` column (new migration), shown with a copy + open button prominently in the Overview tab.
- **Logo upload**: Reuse the existing `AvatarUpload` component with `bucket="company-logos"`.
- **Create cohort**: Calls Supabase insert directly using the SFH `accelerator_id` (bypasses `useAcceleratorProfile` hook which relies on `useAuth()`).
- **Cohort actions**: Admin can create cohorts, update status, and view applications without being the profile's owning user.

---

### Files to Create/Modify

| File | Action |
|---|---|
| `src/components/admin/SFHAcceleratorManager.tsx` | **Create** — new admin management component |
| `src/pages/AdminDashboard.tsx` | **Modify** — add new tab + import |
| Database migration | **Run** — add `external_link` column to `accelerator_profiles` |

