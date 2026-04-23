

# New Profile Type: Member

Add a new role — **Member** — for people who join the platform as part of an existing startup's team rather than founding/leading their own. Members get a streamlined dashboard (no "Journey" tab, since the journey belongs to the startup) and can request to join existing startup profiles to be displayed as part of the team.

## What this changes for users

**Sign-up**
- New "Team Member" option in the role dropdown on the Auth page.
- During profile setup, members fill out a simple personal profile (name, bio, role/title, skills, location, LinkedIn) — no company creation step.

**Member dashboard**
- Same look as the Startup dashboard, **minus the Journey tab** (no roadmap).
- Adds a new **"My Startups"** tab where the member can:
  - Search and request to join any startup on the platform.
  - See pending requests, approved memberships, and their job title at each startup.
  - Leave a startup at any time.

**Startup founder side**
- New **"Team"** sub-section inside their Company Profile / Startup dashboard:
  - Incoming "join my team" requests → Approve / Reject.
  - List of current team members with their title, ability to edit titles, mark as "Co-founder / Lead / Member", and remove.
  - Members are displayed publicly on the startup's profile in a "Team" section under About.

**Public startup profile**
- A new **"Team"** section under the existing About/Details/Deck tabs showing all approved members with avatar, name, title, and link to their member profile.

## Technical plan

### Database (1 migration)

1. Extend the `app_role` enum:
   ```sql
   ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
   ```

2. New table `company_members`:
   ```
   id              uuid pk
   company_id      uuid → companies(id) on delete cascade
   user_id         uuid → auth.users(id) on delete cascade
   title           text          -- e.g. "CTO", "Designer"
   seniority       text          -- 'cofounder' | 'lead' | 'member'
   status          text          -- 'pending' | 'approved' | 'rejected'
   requested_at    timestamptz default now()
   responded_at    timestamptz
   responded_by    uuid          -- founder who acted
   unique (company_id, user_id)
   ```

3. RLS policies:
   - `SELECT`: anyone can read **approved** memberships (for public team display); members can see their own pending/rejected rows; company owners can see all rows for their companies.
   - `INSERT`: authenticated user inserting their own `user_id` with `status = 'pending'`.
   - `UPDATE`: only the company owner (via `companies.user_id = auth.uid()`) can change `status`, `title`, `seniority`. Members can only update their own row to leave (set to 'rejected') or change title if approved=false.
   - `DELETE`: company owner OR the member themselves.

4. Trigger on insert/approval to create a notification + email to the founder ("X requested to join your team") and to the member ("Your request was approved").

5. Update `handle_new_user()` so `member` signups don't create an `investor_profiles`/`mentor_profiles`/`accelerator_profiles` row (they only need the base `profiles` row, which is already created unconditionally).

### Frontend changes

**Sign-up & onboarding**
- `src/lib/validations.ts` — add `'member'` to the `signUpSchema` role enum.
- `src/pages/Auth.tsx` — add `<SelectItem value="member">Team Member</SelectItem>` to the role dropdown.
- `src/pages/ProfileSetup.tsx` — add `member` to the `UserRole` type and to the role grid (icon: `Users`, desc: "Join an existing startup's team"). For members, skip the company-creation step — only collect bio, title, skills, location, links.

**Routing**
- `src/components/DashboardRouter.tsx` — add `case 'member': return <MemberDashboard />;`

**New dashboard**
- `src/pages/MemberDashboard.tsx` — start from the Startup `Dashboard.tsx` layout but:
  - Remove the **Journey** tab and its `<TabsContent value="journey">` block (no `StartupRoadmap`).
  - Add a new **"My Startups"** tab (icon: `Building`) → renders a new `<MemberStartupsTab />` component.
  - Hide startup-owner-only widgets (Pitch Meeting creation, Mentorship offers panel, Manage Job Posts).

**New components**
- `src/components/member/MemberStartupsTab.tsx` — search bar over `companies`, "Request to Join" button, and three lists: Pending / Approved / Past.
- `src/components/member/JoinStartupDialog.tsx` — dialog where a member picks a title before submitting the request.
- `src/components/startup/TeamRequestsManager.tsx` — for founders: pending requests with Approve/Reject + current team list with edit/remove. Mounted inside `CompanyProfileManager`.
- `src/components/StartupTeamSection.tsx` — public read-only "Team" grid added to `StartupProfileView.tsx` as a new tab "Team" (between Details and Deck), querying `company_members` filtered by `status = 'approved'` joined with `profiles`.

**Hooks**
- `src/hooks/useCompanyMembers.ts` — `useMyMemberships()`, `useTeamRequests(companyId)`, `useApprovedTeam(companyId)`, plus mutations `requestJoin`, `approveRequest`, `rejectRequest`, `updateMemberTitle`, `removeMember`. All wrapped with realtime subscriptions on the `company_members` table.

**Avatar / badges**
- `src/components/RoleBasedAvatar.tsx` — add `'member'` to the role union; reuse the `studentBadge` (or a new neutral badge — easy to swap later) so existing avatars don't break.
- Add `'member'` to the `AppRole` union in `src/hooks/useUserRole.ts` and `src/hooks/useProfileWithRole.ts`.

### Out of scope (not changed)
- No payment / subscription logic for members — they use the standard free tier.
- No changes to existing startup/mentor/advisor/investor flows beyond the founder-side Team management widget.
- No admin UI yet for managing members at platform level (founders self-manage their teams).

