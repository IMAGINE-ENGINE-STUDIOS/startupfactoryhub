
## National Archives — Full In-App Content Viewer

### The Problem

Currently the component has two issues that send users outside the app:

1. **"View Full Record on Archives.gov" button** in `RecordDetail` calls `window.open(record.url, '_blank')` — this redirects externally.
2. **Featured collections** are hardcoded stubs with only a title and a 1-sentence description. Clicking one shows almost no content, so there's nothing useful to view in-app.
3. **Search results** only return metadata fields (title, creator, date, description) — no document body, transcriptions, digital objects, or image thumbnails to render.

### The Solution: Fetch Full Record Content via the API

The National Archives API (`/api/v2`) supports:
- **`/records/search`** — already used, returns metadata + `digitalObjects` (image URLs, thumbnails)
- **`/records/parentNaId/{naId}`** — fetches child records (the actual pages/files) of a parent record
- **`/transcriptions/naId/{naId}`** — fetches any crowdsourced transcription text for a record

The plan is to build a **3-layer in-app experience**:

```text
[Search Results Grid]
        ↓ click
[Record Detail View — full metadata + digital images]
        ↓ click thumbnail
[Image/Document Viewer — full-size in-app render]
```

---

### What Will Change

#### 1. Edge Function: `supabase/functions/national-archives/index.ts`

Add two new request types:

- **`type: 'record'`** — Given a `naId`, fetch the full record including:
  - All metadata fields (scope note, organization history, arrangement, restrictions)
  - `digitalObjects` array (thumbnail URLs, object URLs, object type — image/pdf/audio)
  - `transcriptions` by calling `/transcriptions/naId/{naId}`
  - Child records via `/records/parentNaId/{naId}` (e.g., individual pages of a multi-page document)

- **`type: 'featured'`** — Replace hardcoded stubs with real API calls for the 6 featured records using their known `naId` values (e.g., `1` for Declaration of Independence, `1667751` for the Constitution), so they load rich content.

The API key is passed via the `x-api-key` header (correct per the docs), not a query param.

#### 2. UI Component: `src/components/intelligence/NationalArchivesSection.tsx`

**Remove completely**: The `window.open(record.url, '_blank')` button in `RecordDetail`.

**Upgrade `RecordDetail`** to show:
- Full metadata panels (all available fields from the API)
- **Digital Objects Gallery**: A grid of thumbnail images rendered with `<img>` tags inside the app. Clicking a thumbnail opens a full-size in-app lightbox modal (using the existing `Dialog` component from the UI library).
- **Transcription Panel**: If the API returns transcription text, display it in a scrollable tech-card panel with a "Transcription" label.
- **Child Records**: If the record has child pages, show a paginated grid of those thumbnails.

**Add `ImageLightbox` sub-component**: A `Dialog`-based full-screen viewer that shows the selected image at full resolution with prev/next navigation — entirely within the app, no external redirect.

**Update `RecordCard`**: Show thumbnail previews in the card grid if available, making results more visual.

**Update featured loading**: Call `type: 'record'` for each of the 6 featured `naId`s so they display real, rich content.

---

### Technical Details

**API authentication fix**: The current edge function passes the key as `?apikey=` query param. The official docs show it should be in the `x-api-key` header — this will be corrected, which will also fix the HTML error page issue.

**Image rendering**: `digitalObjects` returned by the API include direct image URLs (JPEG/PNG from the National Archives CDN). These are public URLs served from `media.archives.gov` and can be embedded directly in `<img>` tags.

**No external navigation**: The `ExternalLink` button and `window.open` will be completely removed from the user flow. A subtle "Source: archives.gov" attribution text will remain as a non-clickable label for reference.

**Pagination**: For records with many digital objects or child records, a simple prev/next page control will be added within the component.

### Files to Edit

| File | Change |
|---|---|
| `supabase/functions/national-archives/index.ts` | Add `record` type handler; fix API key header; add transcription + child record fetching |
| `src/components/intelligence/NationalArchivesSection.tsx` | Remove all `window.open` calls; add image gallery, lightbox viewer, transcription panel, and child record grid |
