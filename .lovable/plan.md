
## Why you don't see it today

`StartupAnnouncementStudio` IS mounted on `/marketing` — but at line 3120, buried at the very bottom under 16 other banners. You have to scroll ~all the way down to find it. So step one is making it findable, not re-adding it.

## Plan

### 1. Move & anchor the Studio near the top of `/marketing`
- Relocate `<StartupAnnouncementStudio />` from the bottom (banner 17) to a new **first section** of the page, right under the page header.
- Wrap it in a titled section: **"Auto-Publish: New Startup Announcements"** with a short intro line explaining what it does (auto-posts to LinkedIn when a startup completes their profile).
- Add an `id="announcement-studio"` anchor + a small "Jump to Announcement Studio" pill in the page header for quick access.

### 2. Beautify the Studio card (visual only — no logic change)
Redesign `src/components/marketing/StartupAnnouncementStudio.tsx` header + preview surface:
- Header: gradient title ("Startup Announcement Studio"), status row with connection pill (LinkedIn green when connected, amber when not), last-posted timestamp, and a compact stat ("X startups auto-announced").
- Editor column: group into 3 cards — **Content** (startup, headline, subtext), **Style** (layout, background, colors, font), **Publish** (Save / Export PNG / Post now).
- Preview column: add a subtle checkerboard frame around the 1200×627 canvas, a "LinkedIn preview" chrome (avatar + org name + "Just now") so it looks like the real feed post, and a copy-to-clipboard button for the rendered post text.
- Keep `tech-card border-0` glassmorphism, Lucide icons only, no emojis.

### 3. LinkedIn credentials — what's needed
Add a collapsible **"Setup checklist"** panel inside the Studio listing exactly what to configure. Contents:

**A. LinkedIn Developer App** (https://www.linkedin.com/developers/apps)
   - Create/select an app **owned by the Startup Factory Hub Company Page** (the app must be associated with the Company Page you want to post from — otherwise the OAuth will not offer that page).
   - **Products to request & get approved:**
     - `Share on LinkedIn` (grants `w_member_social`)
     - `Sign In with LinkedIn using OpenID Connect` (grants `openid profile email`)
     - `Community Management API` (grants `w_organization_social`, `r_organization_social`, `rw_organization_admin`) — this is the one that actually lets us post as the Company Page. Requires LinkedIn approval; can take a few days.
   - **OAuth 2.0 redirect URL** to add in the app settings:
     `https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/linkedin-org-callback`

**B. Secrets already stored in this project** (no action if present):
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
   
   The Studio will show a green check per secret; if either is missing, it offers a "Configure secret" action.

**C. One-time connect action**
   - Admin clicks **Connect LinkedIn Company Page** in the Studio → completes OAuth → the org URN and access token are saved to `linkedin_org_tokens`. From that point on, the trigger auto-publishes.

### 4. The actual LinkedIn post text (bilingual, editable in the template)

The Studio already reads `headline` + `subtext` from `marketing_templates` with `{startup_name}`, `{industry}`, `{stage}` variables. Update the default template to this polished copy:

**Headline (EN default):**
> `Welcome {startup_name} to Startup Factory Hub`

**Subtext (EN default):**
```
{startup_name} just joined our accelerator — a {stage} venture reshaping {industry}.

We're proud to support their journey with mentorship, capital access, and a global network of founders, investors and operators building the next generation of companies.

Follow along as they build. → startupfactoryhub.com

#StartupFactoryHub #Startups #Innovation #{industry}
```

**Rendered LinkedIn post = headline + blank line + subtext**, followed by an ARTICLE card (logo thumbnail, company name, first 250 chars of description, link to their website). This is exactly what `announce-new-startup/index.ts` already publishes — no backend change needed, only the template text.

The Studio's textareas remain fully editable so you can rewrite this anytime, and the preview + "Copy post text" button reflects the rendered version live.

## Files to change (build phase)
- `src/pages/Marketing.tsx` — move the Studio to the top, add anchor.
- `src/components/marketing/StartupAnnouncementStudio.tsx` — redesign header, preview chrome, group editor into 3 cards, add setup checklist panel + copy-post-text button.
- One SQL migration — update the default row in `marketing_templates` (type `startup_announcement`, `is_default=true`) with the new headline/subtext above.

No changes to edge functions or DB schema.
