
## Fix National Archives API Data Extraction

### Problem
The National Archives catalog API v2 returns records where `_source` has this structure:
```text
{
  metadata: { ... },
  record: {
    title: "...",
    coverageDates: { ... },
    creatingOrganizations: [ ... ],
    scopeAndContentNote: "...",
    digitalObjects: [ ... ],
    ...
  }
}
```

The `mapRecord` function currently looks for fields at `src.title`, `src.coverageDates`, `src.creatingOrganizations`, etc. While `src.record?.title` is checked as a fallback for the title field, most other fields (dates, creators, descriptions, digital objects, etc.) only check `src` and `src.description` -- never `src.record`. This causes all data except title to return as `null`.

### Fix (single file: `supabase/functions/national-archives/index.ts`)

Update the `mapRecord` function to properly resolve data from the `src.record` sub-object:

1. **Add `src.record` as the primary data source** -- extract `const rec = src.record || {};` at the top of `mapRecord`
2. **Update all field lookups** to check `rec` (the record sub-object) first, then fall back to `src` and `src.description`:
   - `title`: check `rec.title` first
   - `date`: check `rec.coverageDates`, `rec.dateNote`
   - `creatingOrganizations`: check `rec.creatingOrganizations`
   - `scopeAndContentNote` / description: check `rec.scopeAndContentNote`, `rec.generalNote`
   - `levelOfDescription`: check `rec.levelOfDescription`
   - `digitalObjects`: check `rec.digitalObjects`
   - `naId`: check `rec.naId`
   - `series`: check `rec.series`
   - `accessLevel`: check `rec.accessLevel`
   - `accessRestriction`: check `rec.accessRestriction`
   - `arrangementNote`: check `rec.arrangementNote`
3. **Add a debug log** to print a sample of `rec` keys so we can verify the fix in logs

### Expected Outcome
Records will return with populated descriptions, dates, creators, thumbnails, and digital objects -- making the National Archives viewer fully functional again.
