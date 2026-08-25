# LinkedIn Scopes: match the app's approved permissions

Your LinkedIn app is approved for a specific scope list (openid, profile, email, r_liteprofile, r_profile_basicinfo, w_member_social, r_organization_admin, rw_events, r_events, r_ads, r_ads_leadgen_automation, r_marketing_leadgen_automation, r_verify).

The authorization request the app currently sends asks for `w_organization_social r_organization_social rw_organization_admin` — none of which are in that approved list. LinkedIn rejects an authorization that requests unapproved scopes, which is consistent with the Company Page connection never completing.

## What this changes

1. **Request the approved scopes only.** The Company Page connect flow will request:
   `openid profile email w_member_social r_organization_admin rw_events r_events r_ads r_ads_leadgen_automation r_marketing_leadgen_automation r_verify`
   The member connect flow keeps `openid profile email w_member_social`.

2. **Store and show granted scopes.** The token record already saves the scope string LinkedIn returns. The connection card in Marketing will list each granted scope as a chip with its plain-language description (the wording from your list), plus a warning chip for any expected scope that was not granted.

3. **New Admin panel: "LinkedIn Permissions".** A card in the admin Marketing tab showing:
   - connection status, page name, token expiry countdown
   - the full scope catalog with description and granted / not granted state
   - checkboxes to choose which scopes to request on the next authorization (defaults to the approved list), so scopes can be adjusted after LinkedIn approves more without a code change
   - a Reconnect button that runs the OAuth flow with the selected scopes

4. **Capability gating.** Event sync outbound posting to the Company Page needs `rw_events` (posting to the page feed itself normally needs `w_organization_social`, which your app does not have). The panels will state clearly which automations are enabled by the granted scopes and which are blocked, instead of failing silently at run time.

## Technical details

- `supabase/functions/linkedin-org-auth/index.ts`: scope string built from the approved list; accepts an optional `scopes` array from the caller (validated against a server-side allowlist) so the admin selector can drive it.
- `supabase/functions/linkedin-org-callback/index.ts`: already persists `scope`; also persist `granted_at` and normalise the scope list.
- `supabase/functions/linkedin-auth/index.ts`: add `email`.
- New `src/components/marketing/LinkedInPermissionsPanel.tsx` holding the scope catalog (id, label, description) and the selector; reused inside `LinkedInConnectionCard.tsx` and mounted in the admin Marketing tab.
- No new tables; a preferred-scopes list is stored in the existing settings row used by the auto-posting hub.
