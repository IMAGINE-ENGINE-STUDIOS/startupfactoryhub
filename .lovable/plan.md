

# Premium VIP Invitation Email for Hot Deals Event

## Overview
Create a new Edge Function `send-hot-deals-vip-invitation` that sends a premium-styled email inviting special guests to the Hot Deals event, with a direct link to the portal at `https://startupfactoryhub.com/hot-deals-space`.

## Changes

### 1. Create `supabase/functions/send-hot-deals-vip-invitation/index.ts`
- Same Resend API pattern as existing email functions
- Accept `to`, `recipientName`, `personalMessage` (optional) in request body
- Premium HTML email with:
  - Gold/green gradient header with SFH logo — "EXCLUSIVE VIP INVITATION" badge
  - Personalized greeting: "You've Been Personally Invited"
  - Event details: Hot Deals in the Space Industry, April 16, 2:00-3:10 PM EST
  - Description: Live startup pitches, NASA AR models, audience voting
  - "In collaboration with NASA Technology Transfer Program" mention
  - Optional personal message section from the inviter
  - Large CTA button: "Enter the Portal" linking to `https://startupfactoryhub.com/hot-deals-space`
  - Gold accent styling to differentiate from standard participant emails
  - Same footer with SFH branding

### 2. Update `supabase/config.toml`
- Register the new function with `verify_jwt = false`

### 3. Deploy
- Deploy via `supabase--deploy_edge_functions`

## Technical Details
- Uses existing `RESEND_API_KEY` secret
- Sends from `info@startupfactoryhub.com`
- Portal link: `https://startupfactoryhub.com/hot-deals-space`
- Premium gold color accents (#D4AF37, #B8860B) combined with existing green brand (#0ea270)

