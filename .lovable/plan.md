

# Create "Participant Notes" Email Template

## Overview
Create a new Edge Function `send-hot-deals-participant-notes` that sends a branded email to pitching startups with preparation instructions for their 10-minute pitch.

## Email Content
- Header: Same branded Hot Deals header used in existing emails
- Main message: Personalized greeting, pitch time details (up to 10 minutes)
- Key notes: If presentation is shorter, moderator may ask follow-up questions about why the solution is important now, or open floor for audience Q&A
- "Come prepared" reminder
- Pitch preparation tips checklist (problem, solution, market, business model, team, the ask)
- Event details reminder (April 16, 2:00-3:10 PM EST)
- CTA buttons: Complete Profile / View Event Portal

## Changes

### 1. Create `supabase/functions/send-hot-deals-participant-notes/index.ts`
- Follow the exact same pattern as `send-hot-deals-reminder` (Resend API, same cors headers, same branding)
- Accept `to`, `recipientName`, `companyName` in request body
- HTML email with:
  - Same green gradient header with SFH logo
  - Personalized greeting
  - "Participant Notes" section with the pitch rules
  - Preparation checklist
  - Event time reminder banner
  - CTA buttons to profile and portal
  - Same footer

### 2. Deploy the Edge Function
- Deploy via `supabase--deploy_edge_functions`

## Technical Details
- Uses `RESEND_API_KEY` env var (already configured)
- Sends from `info@startupfactoryhub.com`
- Matches existing email template styling (green #0ea270 brand, white background, same layout structure)

