

## Goal

Add a new **"Referral Invite"** email template to the Email Command Center (Admin → Emails) that any admin can blast to selected platform users, inviting them to join the Referral Program and earn 20% commission on referred subscriptions.

## What gets built

### 1. New edge function: `send-referral-invite-email`
A transactional sender (modeled on `send-partnership-announcement` and `send-notification-email`) that:
- Accepts `targetEmails[]` and optional per-recipient `recipientName`
- Sends one email per recipient via Resend
- Uses the existing branded dark email template (logo, #0ea270 gradient header, glassmorphism cards) to match other Startup Factory Hub emails
- CTA button → `https://startupfactoryhub.com/referral`

### 2. Email content (HTML, branded)

**Subject:** `Earn 20% commission — refer startups to Startup Factory Hub`

**Body sections:**
1. **Hero** — "Earn 20% Commission" headline + short pitch
2. **The offer card** — "Get 20% of the first month/year of every subscription you refer. Official Mentors & Advisors earn 25%."
3. **3-step "How it works"** card list:
   - **Step 1 — Apply & get approved**: Go to your profile → Referral Program tab → submit application
   - **Step 2 — Connect your Stripe payout account**: From the Referral Program page, click *Connect Account*. You'll be redirected to Stripe Express to link your bank. This is required to receive commissions.
   - **Step 3 — Get your unique referral link**: Once approved, your dashboard shows your unique link (`startupfactoryhub.com/r/SFH-XXXXXXXX`). Create multiple labeled links for different campaigns.
4. **Commission table** (mini): Community $29 → $5.80, Self-Paced $99 → $19.80, Global $199 → $39.80, Corporate $499 → $99.80
5. **Primary CTA button** → "Apply to the Referral Program" → `/referral`
6. **Secondary text link** → "Already approved? Open your dashboard" → `/referral`
7. Footer with Startup Factory Hub branding

### 3. Wire it into `EmailMonitor.tsx` (Email Control Command)

- Add a new entry to the `EMAIL_TYPES` array:
  ```
  { id: 'referral-invite', label: 'Referral Invite', icon: <Gift/>, desc: '...' }
  ```
- Add a new branch in `sendToRecipients()` that loops through selected recipients and invokes `send-referral-invite-email` (with throttle, like hot-deals-feedback)
- Add a new section in the Compose tab showing an **email preview card** (subject, from, CTA, brief body summary) — same style as the Artemis Watch Party preview block — so the admin sees what will be sent before clicking Send

### 4. Files touched

- **New**: `supabase/functions/send-referral-invite-email/index.ts`
- **Edit**: `src/components/admin/EmailMonitor.tsx` (add type, send branch, compose preview)

### What stays the same

- Recipient picker (search, select-all, filter) — already works for any email type
- Existing referral page at `/referral`, the `create-referral-account` and `create-payout-account` edge functions, and Stripe Connect flow are untouched
- No DB schema changes
- No new secrets needed (uses existing `RESEND_API_KEY`)

