

## Premium Mentor/Advisor Program — "Official Mentor" Invite-Only Program

### Overview

Create an invite-only premium program for Mentors and Advisors that grants "Official" status on the platform. Admin sends email invitations; invitees must complete a multi-step onboarding checklist before earning the official badge (star + insignia) visible on their profile and social feed posts.

### Benefits for Official Members
- Access to all platform perks
- Free bank account (HSBC introduction)
- Unique 25% referral commission (instead of standard 20%)
- Direct startup introductions through the venture fund

---

### Database Changes (Migration)

**1. New table: `official_mentor_invitations`**
- `id` (uuid, PK)
- `email` (text, not null)
- `invited_by` (uuid, FK to auth.users — the admin)
- `invitation_token` (text, unique, not null)
- `status` (text: `pending`, `accepted`, `expired`, default `pending`)
- `expires_at` (timestamptz)
- `accepted_at` (timestamptz, nullable)
- `accepted_by` (uuid, FK to auth.users, nullable)
- `created_at` (timestamptz, default now())
- RLS: admin can insert/select; invited user can select/update their own row by token

**2. New table: `official_mentor_status`**
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, unique, not null)
- `invitation_id` (uuid, FK to official_mentor_invitations)
- `profile_completed` (boolean, default false)
- `email_verified` (boolean, default false)
- `connection_invited` (boolean, default false)
- `is_official` (boolean, default false) — set to true when all 3 checks pass
- `referral_commission_rate` (numeric, default 0.25) — 25%
- `granted_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())
- RLS: user can read own row; admin can read/update all

**3. Add column to `profiles` table:**
- `is_official_mentor` (boolean, default false) — quick-access flag for display in feed posts and profile cards

**4. DB function: `check_and_grant_official_status(p_user_id uuid)`**
- Checks if profile is complete (full_name, bio, avatar_url, linkedin_url all non-null)
- Checks if email is verified (auth.users.email_confirmed_at is not null — use security definer)
- Checks if user has at least 1 accepted connection
- If all pass, sets `is_official = true`, `granted_at = now()`, and updates `profiles.is_official_mentor = true`

---

### Edge Function: `send-official-mentor-invite`

- Admin-only (verify service role or admin check)
- Accepts email + optional message
- Generates unique invitation token
- Inserts row into `official_mentor_invitations`
- Sends branded email via Resend with invitation link pointing to `/official-mentor-invite?token=...`

---

### Frontend Changes

**1. New page: `/official-mentor-invite` (OfficialMentorInvite.tsx)**
- Public route for accepting the invitation
- Verifies token against `official_mentor_invitations`
- If user is already registered (mentor/advisor role), links invitation to their account
- If not registered, redirects to signup with pre-filled email and role
- Creates `official_mentor_status` row upon acceptance

**2. New component: `OfficialMentorChecklist`**
- Displayed on Mentor/Advisor dashboard for invited users who haven't completed all steps
- Shows 3 checklist items with status: Complete Profile, Verify Email, Invite a Connection
- Each item shows green check or pending icon
- "Check Status" button calls `check_and_grant_official_status` RPC
- On completion, shows congratulations with the official badge

**3. Official Badge/Insignia in UI**
- Update `RoleBasedAvatar` component: if `is_official_mentor` is true, overlay a gold star/shield insignia
- Update `UnifiedCommunityFeed` post rendering: show official badge next to name for official mentors/advisors
- Update `UserProfileDialog` / profile views: show "Official Mentor" or "Official Advisor" badge

**4. Admin Dashboard — new section in existing management**
- Add "Official Program" sub-tab or section under Users/Partners management
- Form to invite by email
- List of invitations with status tracking
- View checklist progress for each invitee

**5. Referral override for official members**
- When creating referral accounts for official mentors, set commission rate to 25% instead of 20%
- Update referral earnings calculation to use the per-user commission rate

---

### Technical Flow

```text
Admin sends invite email
        ↓
Mentor/Advisor clicks link → /official-mentor-invite?token=xxx
        ↓
Token verified → Account linked → official_mentor_status row created
        ↓
Dashboard shows checklist:
  ☐ Complete profile (name, bio, avatar, linkedin)
  ☐ Verify email
  ☐ Invite 1 connection
        ↓
All 3 complete → RPC grants official status
        ↓
Profile badge + feed insignia activated
25% referral rate applied
```

### Files to Create
- `src/pages/OfficialMentorInvite.tsx`
- `src/components/OfficialMentorChecklist.tsx`
- `src/components/OfficialBadge.tsx`
- `supabase/functions/send-official-mentor-invite/index.ts`

### Files to Modify
- `src/App.tsx` — add route
- `src/components/RoleBasedAvatar.tsx` — add official insignia overlay
- `src/components/UnifiedCommunityFeed.tsx` — show badge next to official users
- `src/pages/MentorDashboard.tsx` — add checklist component
- `src/pages/AdvisorDashboard.tsx` — add checklist component
- `src/components/admin/` — add invitation management UI
- Migration SQL for new tables/columns/functions

