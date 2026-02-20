
# New `/emails` Page — Email Template Manager

## Overview

Create a dedicated `/emails` route that serves as a full **Email Template Manager** for admins. This is separate from the existing `EmailMonitor` tab in the admin dashboard (which handles sending/monitoring). The new `/emails` page will allow admins to **preview, edit, and test** each of the 4 email templates directly in the browser — without touching the edge function code.

---

## What Will Be Built

### 1. New Route: `/emails`

Add `/emails` to `src/App.tsx` pointing to a new `EmailTemplates` page. This page will be **admin-only protected**.

### 2. New Page: `src/pages/EmailTemplates.tsx`

A full-page template manager with:

- **Sidebar** listing all 4 email types
- **Live HTML Preview** (rendered in an iframe) of the selected template
- **Variable controls panel** to fill in dynamic values and see the preview update in real-time
- **Send Test Email** button to fire off a real email to any address

### 3. Template Definitions

Each template is defined with its variables and the HTML rendering logic mirrored from the edge functions:

| Template | Variables |
|---|---|
| Notification Email | `to`, `title`, `message`, `type` (info/success/warning/error/message/connection/event) |
| Application Invitation | `email`, `jobTitle`, `companyName`, `token` |
| Weekly Digest | Preview-only (pulls live data from platform) |
| Partnership Announcement | `partnerName`, `partnerLogo`, `partnerWebsite`, `partnerDescription`, `benefitsForStartups`, `ctaLabel`, `ctaUrl` |

### 4. UI Structure

```text
+------------------------------------------+
|  Email Template Manager     [Admin badge] |
+------------+-----------------------------+
|            |   [Variable Controls]       |
|  Template  |                             |
|  Sidebar   |   [Live HTML Preview]       |
|            |   (iframe, full render)     |
|  • Notif   |                             |
|  • Invite  |                             |
|  • Digest  |   [Send Test Email]         |
|  • Partner |                             |
+------------+-----------------------------+
```

---

## Technical Details

### Files to Create / Modify

1. **`src/pages/EmailTemplates.tsx`** (new)
   - Admin-only guard using `useUserRole()`
   - Left sidebar: 4 template cards (clickable)
   - Right panel: 2-tab layout — "Preview" and "Variables"
   - Preview: rendered inside a sandboxed `<iframe srcDoc={...}>`  
   - Variables: input fields specific to each template type
   - "Send Test" button calls the appropriate Supabase edge function via `supabase.functions.invoke()`

2. **`src/App.tsx`** (modify)
   - Add `<Route path="/emails" element={<EmailTemplates />} />` with lazy import

### HTML Preview

The HTML for each template will be generated client-side using the **exact same template strings** as the edge functions, but with template variable substitution done in JavaScript. This means the preview is 1:1 accurate with what gets delivered to the inbox.

For the **Weekly Digest**, the preview will show a mock version with sample data (since it pulls live data from the DB).

### Send Test Email

When "Send Test" is clicked:
- Calls the matching edge function via `supabase.functions.invoke()`
- Shows a success/error toast
- No page reload needed

### Admin Protection

Uses the existing `useUserRole()` hook. If the user's role is not `admin`, they are redirected to `/auth`.

---

## No Database Changes Required

This is purely a frontend page + no new edge functions. All sends go through existing deployed functions.
