## Auto-Announcement Banner System

Automatically publish a branded "New startup joined" banner to the Startup Factory Hub LinkedIn Company Page when a startup completes their profile, with an editable template studio on `/marketing`.

### 1. Banner Template Studio (`/marketing`)

New section **"Startup Announcement Banner"** with:
- **Template layout picker** — 3 preset layouts (Centered logo, Split left/right, Gradient hero)
- **Background picker** — solid brand color, gradient presets, or upload image
- **Copy editor** — headline + subtext with variables: `{startup_name}`, `{industry}`, `{stage}`, `{founder}`
- **Color & font controls** — primary color, accent color, font family (from brand set)
- **Startup selector** — dropdown of all platform startups; live preview renders their real logo + data
- **Regenerate / Export PNG** — html2canvas rendering to 1200×627 (LinkedIn optimal)
- **Save as default template** — persists to DB so auto-posts use it

### 2. Auto-trigger on Profile Complete

- New DB column `companies.announcement_posted_at` (timestamp, nullable)
- DB trigger `notify_startup_profile_complete`: fires AFTER UPDATE on `companies` when `logo_url IS NOT NULL AND name IS NOT NULL AND description IS NOT NULL AND announcement_posted_at IS NULL` — calls edge function via `pg_net`
- Edge function `announce-new-startup`:
  1. Loads active banner template from `marketing_templates` table
  2. Renders banner server-side (Puppeteer/Deno satori) → PNG
  3. Uploads to `marketing-banners` storage bucket
  4. Posts to LinkedIn Company Page via `/v2/ugcPosts` with `urn:li:organization:{ORG_ID}`
  5. Stamps `announcement_posted_at`

### 3. LinkedIn Company Page Setup

Requires a **new** LinkedIn app auth flow (current `linkedin-post` is personal-profile only):
- New edge functions: `linkedin-org-auth` + `linkedin-org-callback` with scopes `w_organization_social`, `r_organization_admin`
- New table `linkedin_org_tokens` (org_urn, access_token, refresh_token, expires_at)
- Admin-only "Connect Company Page" button in `/marketing`
- Secrets needed: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` (may already exist)

### 4. Database

New tables:
- `marketing_templates` (id, name, type='startup_announcement', layout, background, headline, subtext, primary_color, accent_color, font_family, is_default, created_by, timestamps) + RLS admin-only write, authenticated read
- `linkedin_org_tokens` + RLS admin-only
- `marketing_posts_log` (id, company_id, template_id, banner_url, linkedin_post_id, posted_at, status) for audit

New column: `companies.announcement_posted_at`

### 5. Files

**New**
- `src/components/marketing/StartupAnnouncementStudio.tsx` — editor + preview
- `src/components/marketing/BannerCanvas.tsx` — renders template layouts
- `src/hooks/useMarketingTemplates.ts`
- `supabase/functions/announce-new-startup/index.ts`
- `supabase/functions/linkedin-org-auth/index.ts`
- `supabase/functions/linkedin-org-callback/index.ts`

**Modified**
- `src/pages/Marketing.tsx` — add new section (keep existing untouched)
- Migration for tables, column, trigger, RLS, grants

### Open items to confirm during build
- LinkedIn Company Page ID (Organization URN) — you'll need to paste it once connected
- Whether image upload for custom backgrounds should use existing storage or a new bucket
