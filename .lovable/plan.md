

## Diagnosis

The published site is fine. I verified:
- `https://startupfactoryhub.com/brochure` → HTTP 200
- `https://startupfactoryhub.com/hot-deals/feedback` → HTTP 200
- Latest deployment ID `64f652a6...` is live
- Project is published and public

**The 404s you're seeing are from your browser, not the server.** Old cached service workers + cached `index.html` are intercepting requests for new routes (`/brochure`, `/hot-deals/feedback`, `/marketing`) before they reach the network. The current reset logic in `src/main.tsx` uses a single `localStorage` flag (`sfh_sw_reset_v3`) that only fires once — so after a user has visited the site once, future deploys never trigger a fresh cache reset.

## Fix — bump the cache-buster + add a build-version check

### Change 1 — `src/main.tsx`

Replace the static reset key with a build-version-based key so every new deploy automatically clears stale service workers and caches for every visitor.

- Replace `const SW_RESET_KEY = 'sfh_sw_reset_v3';` with a key that incorporates `import.meta.env.VITE_BUILD_ID` (or fallback to a bumped version like `'sfh_sw_reset_v4'` for an immediate fix).
- On every page load, compare the stored value against the current build key. If different → unregister all service workers, clear all `caches`, store the new key, then `location.reload()` (only once per build to avoid loops, guarded with a `sessionStorage` flag).
- Keep the existing `vite:preloadError` and `unhandledrejection` recovery handlers untouched.

### Change 2 — `index.html`

Add a `<meta http-equiv="Cache-Control" content="no-cache">` for the HTML document so the entry HTML itself is never cached by the browser. (Asset files keep their hashed-filename caching — only `index.html` becomes always-fresh.)

### Change 3 — Immediate user remedy

The above fix will help for future deploys. For the current stuck state, you (and any user reporting 404) need a one-time hard reset:

1. Open the site
2. DevTools → Application → Storage → **Clear site data**
3. Or in private/incognito window the routes will work immediately

I'll include a small `/clear-cache` helper route (or a button on `NotFound.tsx`) that programmatically unregisters service workers + clears caches + reloads, so non-technical users can self-fix.

### Files touched

- `src/main.tsx` — bump reset key + per-build invalidation logic
- `index.html` — add no-cache meta for HTML
- `src/pages/NotFound.tsx` — add a "Clear cache & retry" button that runs the reset routine

### What stays the same

- All routes already exist correctly in `App.tsx`
- The `Brochure`, `HotDealsFeedbackPage`, and `Marketing` page code is fine and deployed
- No publish/visibility changes needed (already public)

