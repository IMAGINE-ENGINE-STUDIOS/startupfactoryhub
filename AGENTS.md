# Project architecture rules

- Event participants pay only the displayed ticket price; the 5% platform fee is deducted from the organizer payout and is never shown on participant-facing event pages.- Imagine Engine flow runtime actions live in public/imagine-engine/ai.js (window.__IEX / __IEMeta) and are dispatched from the bundle's run loop; why: the minified bundle is only patched via string replacements.
- Imagine Engine per-element editing (select, Content-tab styling, drag/move across widgets) lives in public/imagine-engine/edit.js and persists to localStorage; why: widget components are minified and can't be edited in place.
- Imagine Engine account sync, media uploads, shared cart, checkout and payment setup live in public/imagine-engine/commerce.js plus the imagine-commerce edge function (user data in private storage JSON, media in a public bucket); why: no database migrations are possible on the external Supabase from here.
