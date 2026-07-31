## What I found

14 of 156 accounts never completed email verification (3 in the last 30 days), so this is a real, recurring failure — not a one-off.

The verification page at `/verify-email` only understands **one** of the four ways Supabase can return a user from a confirmation link:

| Link outcome | Handled today? |
|---|---|
| Tokens in the URL fragment (`#access_token=...`) | Yes |
| One-time code in the query string (`?code=...`) | No — falls through, spins, then fails |
| Hashed token (`?token_hash=...&type=signup`) | No |
| Error returned in the query string (`?error=access_denied&error_code=otp_expired`) | No — shows a generic "something went wrong" after a 5-second spinner |

The password-reset page already handles all of these correctly; the verification page was never brought up to the same standard.

Two additional gaps make it worse:
- **No resend option.** When a link fails, the only button is "Back to Sign In" — the user is permanently stuck with an unverified account and no way to request a new link.
- **Corporate email scanners.** Outlook/Defender and similar security tools pre-click links in emails. Because a confirmation link is single-use, the scanner consumes it and the real user then sees "invalid or expired". This disproportionately hits startups on business email — matching the reported pattern.

## Plan

**1. Rewrite the verification handling on `/verify-email`**
- Read both the query string and the URL fragment.
- Support all four cases: fragment tokens, `?code=` exchange, `?token_hash=` confirmation, and explicit error parameters.
- Surface the real reason (link expired, link already used, invalid link) instead of a generic message, and drop the arbitrary 5-second timeout in favor of resolving when the check actually finishes.

**2. Add a "Resend verification email" action**
- Shown on the failure state of `/verify-email`, pre-filled with the email from the link when available, otherwise a small email input.
- Also add it to the Sign In tab: if sign-in fails because the email isn't confirmed, offer a one-click "Resend verification email" instead of only an error toast.
- Include a cooldown so repeated clicks can't trip the provider's hourly email limit.

**3. Reduce scanner-consumed links**
- On the failure state, make the recovery path obvious and one click, so a scanner-eaten link costs the user seconds instead of blocking them.
- If you want it fully eliminated, the stronger fix is switching confirmation emails to a "click to confirm" button on our page (the link itself carries no consumable token until the user presses it). I'd recommend doing step 1-2 first and only going further if failures continue.

**4. Verify**
- Sign up a fresh test account, run the real link through the flow, and confirm the account flips to verified.
- Test the failure paths (expired link, already-used link) and confirm the resend actually delivers a working new link.

## Technical notes

- Files touched: `src/pages/VerifyEmail.tsx` (main rewrite), `src/pages/Auth.tsx` (resend on unconfirmed sign-in).
- Resend uses `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } })`.
- Token handling mirrors the existing logic in `src/pages/ResetPassword.tsx`: `exchangeCodeForSession` for `?code=`, `verifyOtp({ token_hash, type })` for hashed tokens, `setSession` for fragment tokens.
- No database or schema changes required.
- One thing to confirm outside the code: the site URL and redirect allow-list in the Supabase Auth settings must include the production domain, otherwise confirmation links bounce to the wrong origin. I'll flag it if the test signup shows a mismatch.
