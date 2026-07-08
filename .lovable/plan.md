## Business Card Scanner

Add an AI-powered business card scanner that captures a photo (camera or file upload), extracts contact fields via Lovable AI vision, saves the card image to Supabase Storage, and creates a CRM lead with the image attached. Entry points in both the CRM Board and the Network tab.

### User flow
1. User clicks **Scan business card** (in CRM header and Network > Investors area).
2. A dialog opens with two options: **Take photo** (opens camera via `<input type="file" accept="image/*" capture="environment">`) or **Upload image**.
3. Preview appears. User clicks **Extract fields**.
4. Backend AI parses the image and returns: `name`, `title`, `company`, `email`, `phone`, `website`, `address`, `notes`.
5. Editable form is pre-filled. User can correct anything.
6. User clicks **Save to CRM** → image uploads to Storage, CRM card is created in the Leads stage with the image URL and all fields.
7. Toast confirms, dialog closes, CRM list refreshes.

### Data model
- **Storage bucket:** `business-cards` (private). RLS: users can read/write only their own folder `<user_id>/...`.
- **crm_cards:** add nullable column `image_url TEXT` and `metadata JSONB` (metadata stores extracted address/website that don't map to existing columns). No breaking changes.

### Backend
- **New edge function `scan-business-card`** (`verify_jwt = false`, validates JWT in code):
  - Accepts `{ image: base64 data URL }`.
  - Calls Lovable AI Gateway `google/gemini-2.5-flash` with a vision message (`image_url` block) and a strict JSON extraction prompt.
  - Returns `{ name, title, company, email, phone, website, address, notes }` (all strings, empty when not detected).
  - Handles 429 (rate limit) and 402 (credits) with clear error responses.

### Frontend
- **New component `BusinessCardScannerDialog.tsx`** — reusable dialog with:
  - Two capture buttons (Camera / Upload), image preview, Extract button, editable form, Save button.
  - Uses `supabase.storage.from('business-cards').upload(...)` then `getPublicUrl`/signed URL.
  - Inserts into `crm_cards` (Leads stage of user's default pipeline; auto-creates pipeline/stage if missing — same pattern as the existing investor sync).
  - Accepts optional `onSaved` callback to refresh parent lists.
- **CRMBoard.tsx:** add a **Scan card** button next to *Sync Investors* / *Add Client*, opens the dialog, refreshes stages on save.
- **MatchingSystem.tsx (Network tab):** add a **Scan business card** button near the Investor Directory header, opens the same dialog.

### Technical details
- Camera capture on mobile: `<input type="file" accept="image/*" capture="environment">` (no getUserMedia complexity, works on iOS/Android).
- Image compressed client-side (max 1600px, JPEG 0.85) before sending to AI and Storage to keep payload small.
- AI prompt requests strict JSON only; response parsed with a try/catch fallback that extracts the first `{...}` block.
- Storage path: `<user_id>/<crm_card_id-or-uuid>-<timestamp>.jpg`.
- Storage bucket is private; the image URL saved to `crm_cards.image_url` is a signed URL (long-lived) or the object path — decision: store the object path and generate signed URLs on read (more secure). The CRM card view will need a small helper to resolve the signed URL when rendering.

### Files changed / created
- **New:** `supabase/functions/scan-business-card/index.ts`
- **New:** `src/components/BusinessCardScannerDialog.tsx`
- **Edit:** `src/components/CRMBoard.tsx` (button + integration, render `image_url` thumbnail on cards)
- **Edit:** `src/components/MatchingSystem.tsx` (button in the investor tab)
- **Migration:** add `image_url`, `metadata` columns to `crm_cards`; create `business-cards` storage bucket + RLS policies.
- **Config:** `supabase/config.toml` — register `scan-business-card` with `verify_jwt = false`.

### Out of scope
- OCR fallback if AI fails (user can just type the fields manually in the editable form).
- Bulk scanning multiple cards at once.
- Editing/re-scanning cards already saved to CRM.
