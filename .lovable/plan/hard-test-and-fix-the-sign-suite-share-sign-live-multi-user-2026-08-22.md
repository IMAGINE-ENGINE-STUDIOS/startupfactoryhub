# Hard test and fix the Sign suite (share, sign, live multi-user editing)

Goal: prove the whole `/sign` flow works with several people on the same link at the same time, then fix everything the test breaks.

## Phase 1 — Full end-to-end test (before any change)

Drive real browsers against the running app with two independent sessions on the same share link and record what happens at each step.

1. Owner session: open `/sign`, create a document from a template and upload a document (PDF, DOCX, legacy DOC).
2. Generate the share link in each of the three access modes (view / sign only / live edit + sign).
3. Second session (separate browser context, signed out): open the link and confirm the correct permissions apply for each mode.
4. Signing: click a blue signature line, draw a multi-stroke signature, confirm, and verify the signature appears in the document, in the signatures strip and in the activity ledger.
5. Realtime: with both sessions on the same live-edit link, type in one and confirm the other sees the text arrive without reloading; sign in one and confirm the other sees the signature and the "X is updating / signed" notice.
6. Post-signature: automatic PDF download, print, and email send.
7. Mobile viewport pass on the same flow.

Each step gets a screenshot plus console/network capture so failures are attributable.

## Phase 2 — Fixes

Fix every defect the test surfaces. Three issues are already visible in the code and will be addressed regardless:

- **Concurrent edits are dropped.** While a user is typing, incoming remote drafts are ignored entirely, so two people typing at once lose each other's text (last save wins on the whole document body).
- **Drafts are broadcast but never persisted.** A live draft only lands in the other participant's memory; if that person never saves, the text is lost on reload.
- **Spanish strings in the Sign UI.** The share dialog in Sign Studio still shows "Ver mis documentos", "Compartir", "Firma requerida". English is the default across the product.

## Phase 3 — Re-test

Re-run the full Phase 1 script after the fixes, including the two-session realtime case, and report the final result per step.

## Technical notes

- Test harness: Playwright with two browser contexts against the local dev server; the authenticated context is restored from the existing preview session.
- Realtime path: `src/hooks/useLiveSignDocument.ts` (Supabase broadcast channel `sign-document:<token>`), consumed by `src/pages/SignDocument.tsx`.
- Concurrency fix approach: apply remote drafts even while typing by merging into the non-focused region and keeping the local caret, plus a short debounced autosave via `save_sign_document_by_token` so live text survives reload.
- Backend RPCs (`get_sign_document_by_token`, `submit_sign_signature`, `save_sign_document_by_token`, ledger) already exist and are expected to stay unchanged unless the test proves otherwise.
- No UI redesign: only defects and the Spanish strings get touched.
