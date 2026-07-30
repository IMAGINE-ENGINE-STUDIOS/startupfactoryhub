# CAN-SPAM Compliance + Delete Profile

Two workstreams: make every outbound email compliant, and put a self-service account deletion button in every profile's Edit Profile area.

## 1. Global unsubscribe infrastructure

**Table `email_unsubscribes`** — keyed by lowercased email (not user id), so it also covers recipients who are not platform members (invitees, applicants, external speakers).
- `email` (primary key), `reason`, `unsubscribed_at`, `source` (which email triggered it)
- Only backend services read/write; no client access.

**Signed unsubscribe tokens** — a generated `EMAIL_UNSUBSCRIBE_SECRET` used to HMAC each recipient's email. The link carries `?e=<email>&t=<hmac>`, so it cannot be forged and works without login.

**Edge function `email-unsubscribe`** (replaces the newsletter-only one)
- `GET` with a valid token → immediately inserts into `email_unsubscribes` and shows a branded confirmation page. One click, no login, no confirmation step — processed instantly, not in 10 days.
- Also flips `profiles_data.newsletter_opt_out` when the email belongs to a member, so both paths stay in sync.
- Includes a "resubscribe" link on the confirmation page in case of a mis-click.
- `POST` accepted too, so mail clients that honor `List-Unsubscribe=One-Click` work.

## 2. Compliant footer on every email

**Shared module `_shared/email-compliance.ts`** exporting:
- `complianceFooter(email)` — returns the standard HTML block:
  - "This email was sent by **Startup Factory Hub**" + logo/wordmark and the platform URL
  - Physical address: 6900 Tavistock Lakes Boulevard Southeast, Suite 400, Lake Nona Center, Orlando, FL 32827
  - One-click unsubscribe link built from the signed token
  - Copyright line
- `unsubscribeHeaders(email)` — returns `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers, so Gmail/Apple Mail show their native unsubscribe button.
- `filterUnsubscribed(emails)` — drops any address present in `email_unsubscribes` before sending.
- `SENDER` constant — `Startup Factory Hub <info@startupfactoryhub.com>` with consistent, non-deceptive subject prefixes.

**Rollout across all email-sending edge functions** (every function that posts to Resend — newsletter, weekly digest, product update, partnership announcements, invitations, notifications, booking emails, proposal/PDF emails, referral invites, hot-deals emails, etc.):
- Import the shared module, append `complianceFooter`, attach the unsubscribe headers, and run recipients through `filterUnsubscribed` before sending.
- Per your choice, this applies to **every** outbound email, transactional included.
- Auth emails (password reset, verification) are excluded from suppression — a suppressed address would lock the user out; they still get the address + identification footer.

Also updates the shared HTML helpers already in the codebase (`moonshotnxEmailHtml.ts`, `productUpdateEmailHtml.ts`, notification email template) to use the same footer.

## 3. Admin visibility

A small "Unsubscribes" section in the admin Emails tab: total count, recent opt-outs with date and source, and a search box. Read-only, admin-gated.

## 4. Delete my profile button

`DeleteAccountDialog` already exists and calls the `delete-account` function; it is currently only wired into Profile Setup and the dashboard nav. Adds a **Danger Zone** block at the bottom of the Edit Profile section in:
- `CompanyProfileManager` (startups)
- `InvestorProfileView`
- `AcceleratorProfileView`
- `StudentProfileView`
- the mentor/advisor profile editors
- the generic member profile settings

Each shows: "Delete my profile — permanently removes your account, profile and content. This cannot be undone." with a destructive button opening the existing type-DELETE confirmation dialog. No change to the deletion backend itself.

## Technical notes

- One migration: `email_unsubscribes` table with grants and RLS (service-role writes, admin read).
- `EMAIL_UNSUBSCRIBE_SECRET` is generated automatically — nothing for you to paste.
- Existing `newsletter-unsubscribe` links stay working by redirecting to the new function.
