

## Plan: Add SFH Image Creator Tool (Powered by Imaginaly AI)

### What We're Building
A self-contained **SFH Image Creator** tool in the Tools page that lets users generate AI images from text prompts, styled with SFH branding. It uses the Lovable AI gateway's `google/gemini-2.5-flash-image` model for image generation -- the same underlying AI tech as [Imaginaly](/projects/9aced1bd-5f0f-4eae-9b2c-183bfea54443), repackaged as an SFH-native tool.

### Why Not Direct Port
Imaginaly's core relies on 16+ edge functions tied to its own Supabase backend (edit-image, generate-video, scene-chat, etc.) with specialized hooks (useSceneEditor, usePipelineExecutor, useProductCatalog). Porting all of this would break due to missing database tables, storage buckets, and API keys (Runway, FAL AI). Instead, we build a clean SFH-native implementation using the Lovable AI image generation gateway that's already available.

### Free Tier & Gating
- **10 free images** for all users (tracked in a new `image_generation_usage` database table)
- After 10 free images, requires **basic paid subscription** ($350+ Community tier)
- Usage counter displayed in the UI

### New Files

1. **`supabase/functions/generate-sfh-image/index.ts`** -- Edge function that:
   - Authenticates the user
   - Checks usage count from `image_generation_usage` table
   - If count >= 10, checks membership status via `check-membership` function
   - Calls Lovable AI gateway with `google/gemini-2.5-flash-image` model
   - Extracts the base64 image from response, uploads to Supabase storage
   - Returns the public URL
   - Logs to `api_usage_logs`

2. **`src/components/SFHImageCreator.tsx`** -- Full image creation UI with:
   - Text prompt input with placeholder suggestions
   - Style presets (Photorealistic, Digital Art, Watercolor, etc.)
   - Generated image display with download button
   - Generation history (session-local)
   - Usage counter badge ("3/10 free" or "Unlimited" for subscribers)
   - SFH branding: tech-card styling, emerald accents, "Powered by SFH Intelligence" footer
   - Membership gate modal when free limit reached

### Database Migration
- Create `image_generation_usage` table: `id`, `user_id`, `prompt`, `image_url`, `created_at`
- RLS: users can only read/insert their own rows

### Files to Modify

- **`src/pages/Tools.tsx`** -- Add "SFH Image Creator" to the `aiTools` array with `Sparkles` icon and a new dialog that renders `SFHImageCreator`. Add the `openDialog === "image-creator"` dialog block.

### Technical Flow
```text
User types prompt → Frontend calls generate-sfh-image edge function
  → Edge function checks auth + usage count
  → If over limit, checks membership via check-membership
  → Calls Lovable AI gateway (gemini-2.5-flash-image)
  → Uploads base64 result to Supabase storage
  → Returns public URL + inserts usage row
  → Frontend displays image with download option
```

