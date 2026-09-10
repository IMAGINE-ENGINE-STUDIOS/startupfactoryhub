# Erased signatures must disappear from the contract

Two of the three reported issues are already fixed (documents no longer lose pages when saving, and the All Community list now shows Message/Pending instead of a broken Connect button).

The third one is confirmed and needs a slightly bigger change, described below.

## The problem

When an admin erases a signature:

1. The signature is deleted from the database, but the image stays visible on the contract page and in the PDF that gets downloaded or emailed.
2. Signatures are placed on the signature lines purely in the order they were collected. So once one is erased, everyone else's signature moves up one line — the contract can show the wrong person signing on someone else's line.

## What to build

**1. Remember which line each signature belongs to**

- Add a line position to the stored signature record, and accept it when a signature is submitted (database change plus the two related database functions that write and read signatures).
- Existing signatures keep their current order as their position, so old contracts render exactly as they do today.

**2. Place signatures by their own line, not by order**

- In the contract viewer, each stored signature is drawn onto the line it was actually signed on.
- The line index already captured at signing time is sent along when the signature is submitted.

**3. Make erasing actually erase**

- Add a reset for a signature line that removes the image and restores the blank underscore line, keeping its original length.
- After deleting, both the on-screen contract and the hidden copy used to build the PDF are rebuilt from the stored signatures, so the erased one is gone everywhere — including any PDF generated or emailed afterwards.
- The cached PDF is invalidated on delete so a stale file can't be sent.

## Technical notes

- `sign_signatures` gains a nullable `field_index integer`; backfilled per document by `signed_at` order. `submit_sign_signature` takes an extra `_field_index` parameter (default null) and `get_sign_signatures_by_token` returns it.
- `src/lib/signatureFields.ts`: add `clearSignatureField(field)` that restores the original underscore run (stored on the element at mark time) and removes `sfh-sign-field--signed`.
- `src/pages/SignDocument.tsx`: the placement effect first clears every signed field, then fills `fields[signature.field_index ?? order]`; `deleteSignature()` sets `pdfRef.current = null` and re-runs placement after `refresh()`.
- Verify with Playwright on a live contract: sign two lines, erase the first, confirm the second stays on its own line and the erased one is gone after reload and in the generated PDF.
