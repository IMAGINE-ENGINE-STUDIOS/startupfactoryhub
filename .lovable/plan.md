
# Intern Migration + Activation Email

## 1. CSV upload (admin only)

A new admin page `/admin/intern-migration` lets you:
- Upload a CSV (columns: `email` required; `full_name`, `program`, `company` optional).
- Preview parsed rows + duplicate detection (against existing `profiles` and `intern_invitations`).
- Click **Import & Send Invites** to process.

## 2. Database changes

New table `intern_invitations`:
- `email` (unique), `full_name`, `program`, `company`
- `invite_token` (uuid, unique, indexed) — used in activation URL
- `status` (`pending` | `sent` | `activated` | `expired`)
- `sent_at`, `activated_at`, `expires_at` (default now() + 30 days)
- `invited_by` (admin user_id)

Standard `id`, `created_at`, `updated_at`, RLS:
- Admins (via `has_role(auth.uid(),'admin')`) can do everything.
- Public (anon) can `SELECT` a single row **only by `invite_token`** — needed so the activation page can validate the token before signup.
- Service role full access for the edge function.

Grants included per platform rules.

## 3. Edge functions

**a. `import-interns`** (admin-only, JWT verified):
- Accepts parsed CSV rows.
- Inserts into `intern_invitations` with a generated `invite_token`.
- Skips emails that already have a profile or pending invite.
- Returns a summary `{ created, skipped, errors }`.

**b. `send-intern-invite`** (admin-only):
- Takes a list of invitation IDs (or "all pending").
- For each one, calls the existing email pipeline (`send-notification-email` already wired in the project) with the rendered HTML template below.
- Marks rows as `sent`.
- Throttled in batches (50 at a time) to respect rate limits.

The email is sent via the email system already connected to the app (the `send-notification-email` function + the existing SMTP/provider setup behind it). No new provider is added.

## 4. Activation flow

New public page `/activate/:token`:
1. Reads token from URL, fetches the invitation row (anon SELECT by token).
2. If valid + pending: shows a welcome screen with the intern's name + a **Create your account** form (email pre-filled & locked, password + confirm).
3. On submit: `supabase.auth.signUp` with `role: 'intern'` metadata → existing `handle_new_user` trigger creates the profile + role. Then marks invitation `activated`.
4. Redirects to the Intern Dashboard.
5. If token is invalid/expired/already used: friendly error states.

## 5. Announcement email content (professional & welcoming)

Subject: **Welcome to Startup Factory Hub — Activate Your Intern Profile**

Body outline:
- Greeting with first name.
- One paragraph: "We've launched a new platform to manage all internship activity in one place — applications, tasks, mentors, events, and certificates."
- "What you can do once you're in" — 4 bullets (track tasks, message mentors, join events, earn certificates).
- **Big CTA button** → `https://startupfactoryhub.com/activate/{token}`.
- "How to activate" — 3 numbered steps (click the button, set your password, complete your profile).
- Plain-text fallback link.
- Footer with support email + note that the link expires in 30 days.

Styled to match the existing platform branding (glassmorphism-inspired clean layout, brand primary color, no emojis per project rules).

## 6. Admin UI details

`/admin/intern-migration` shows:
- Upload zone (drag-drop CSV, sample template download).
- Preview table with row-level status (new / duplicate / invalid email).
- "Import" button → calls `import-interns`.
- After import: list of all invitations with filters (pending / sent / activated), per-row **Resend** button, and bulk **Send all pending**.

## Technical details

- CSV parsed client-side with `papaparse`.
- Email validation with `zod` before insert.
- Activation token is a UUID v4 stored unhashed (single-use, expirable, low-risk because it only allows signup with the bound email).
- All admin actions gated by `has_role(auth.uid(), 'admin')` on both client (route guard) and server (edge function check).
- No existing UI components are modified — only new pages and one new admin nav link.
- Uses the existing `send-notification-email` edge function so no new email provider/secret is required.

## Out of scope (unless you ask)

- Importing additional historical data (past tasks, certificates).
- SSO / magic-link sign-in (we use email+password activation as chosen).
- SMS or WhatsApp notifications.
