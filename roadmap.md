# Roadmap

## Imagine Engine Phase 1
- [x] Add Groq Llama and optional authenticated public-HTTPS Ollama routing
- [x] Make configured provider/model selections drive Imagine AI requests
- [x] Authenticate 3D AI requests before provider calls
- [x] Nine routing/auth tests passed; deployed both functions and verified live anonymous/invalid-token rejection
- [ ] Signed-in model-generation and admin settings verification: blocked by unavailable authenticated testing on external Supabase; Ollama also needs the owner's HTTPS server and access key

## Net + public profiles (current)
- [x] Net cards: large photo, Message replaces Connect when connected/requested, shuffle per tab, responsive grid
- [x] Profile icon moved from header into the dashboard tab bar (far right)
- [x] Public user page /u/:id with owner-chosen tabs (pitch, mandate, business plan, products, services, media, custom), posts, events, jobs
- [x] Products/services sold through platform Stripe (10% fee), sales recorded
- [x] Admin dashboard Sales tab tracking every seller's sales

## Membership (live)
- [x] Basic membership brochure at /basic-plan and /membership
- [x] Stripe subscription checkout: $50/month or $480/year (20% off)
- [x] `membership_grants` table + `has_membership_access()` (admin-issued complimentary access)
- [x] Access rule: admins, granted users, and any paid membership unlock the 11 services
- [x] Upgrade pop-up (monthly / yearly) shown when a free user hits a gated action
- [x] Admin dashboard "Grants" tab to grant/revoke membership by email
- [x] Gated: community feed posting, resource map submissions, direct messaging / investor contact
- [x] Gating extended to event RSVP, internship applications and opportunity/job applications
- [x] Monthly Stripe price verified: active, recurring monthly, $50.00 USD (live)
- [ ] Address Supabase security-linter warnings (security-definer execution, leaked-password protection)
- [x] Investor Priority brochure: FAQ page removed, replaced by integrated Stripe checkout ($500/mo · $5,000/yr)
- [x] Basic + Investor brochures: imagery-led editorial entitlement tiles

- [x] Features section: replaced stylized mockups with real app screenshots (src/assets/features/) + left/right arrow navigation
- [x] Removed badge chips: Platform Capabilities, Live Ecosystem Intelligence, Deep Tech Accelerator, hero AI-POWERED badge

- [x] MVPBrochure (/forstartups): full-space agenda cards, dynamic hover, neo colors, tree animation in deliverables, new VR page 12 (apply 13, 14 total)
- [x] MVPBrochure: interactive 4-phase step navigator on agenda pages, full-size GrowthSection tree, program cost on closing page

- [x] LightPaper: move icon from DashboardHeader upper bar to main DashboardTabsNav next to Tools, add workspace tab content in every dashboard

## MVP brochure imagery (done)
- [x] Replace tree animation in agenda deliverables panel with phase-specific imagery (Validate/Build/Test & Launch/Grow & Fund), fixed different image per agenda page
- [x] Move $5,000 program cost lock-up from closing page to Apply page (page 13)

## Current combined fixes
- [x] Simplify the shared NET tab across all profile types without flattening result or connection sections
- [x] Repair LightPaper save failures, page rendering glitches, and workspace navigation/back behavior
- [x] Add All Community search/filter and exclude incomplete, My Accelerator, and demo profiles from NET
- [x] Remove generic rocket/Lovable-style icons from the affected network experience
- [x] Improve /forstartups over-image text contrast to clear white text

- [x] Simplify accelerator memberships to one $5,000 plan plus Contact Sales for Cohorts
- [x] Remove the requested decorative element from the Genius AI plans section
- [x] Merge accelerator programs into Accelerator Memberships 4-card grid
- [x] Delete 'Built for Everyone' section from home page

## LightPaper save + feed attachments
- [ ] Fix "Failed to save project" (search-index trigger on large documents, storage grants)
- [ ] Feed uploads: show attached files as downloadable items with inline preview
- [ ] Home page: move logo carousel to directly below the hero section video

- [x] Home page edit mode: drag & drop section reorder + delete/hide sections, saved to publish (admin only)
- [x] Replace About hero planet background with black deep-space starfield

- [x] MVP follow-up email for accepted-but-unregistered startups: urgency (they lose their spot), low-cost build + network, financing support via info@startupfactoryhub.com; button next to reject/interview invite in cohort application review.
- [x] General Accelerated Fundraising invitation email with animated banner and direct application link in Email Command Center.

## Imagine Engine widgets (phased)
- [x] Step 1: widgets editable (text, background, border), movable, real previews
- [ ] Step 2: map widgets track the shop's own places
- [ ] Step 3: global cart + Stripe (admin → SFH Stripe; users → Stripe Connect or own keys; admin-set fee)

- [x] Imagine Engine Step 2: map widget controllers, remove Layout tab, Design+Content integration, thumbnail reload fix

## Website reorganization (done)
- [x] About link in top menu (desktop + mobile) and footer → /about
- [x] Built for Everyone + Powerful Features moved to the About page
- [x] All plans in one tabbed widget; default tab: Free AI, Starter AI, Basic, Self-Paced + Desk

## Imagine Engine canvas overhaul
- [x] Content/Design edits reach the upper 40 widgets (text, font, size, image upload, links)
- [x] Edits and real maps show in Play as user; page links switch pages
- [x] Section handle: up/down arrows + delete with confirmation
- [x] Undo / redo across canvas, flow and dev (Ctrl+Z / Ctrl+Y)
- [x] Record + version log in header; restore costs credits, free for admins
- [x] Magnetic element drag with transparent preview; free drop leaves others untouched
- [x] Phone/iPad: header fits, bottom bar = AI, Widgets, Projects, Content, Design
- [ ] Page background editor + "merge widget with background"
- [ ] Click-on-map pin placement for map widgets

- [ ] Credit top-up packs: waiting on user to set the price (they disputed 100 credits = $5)

## Imagine AI job (Oct 2026)
- [x] Groq router on openai/gpt-oss-20b (fast), gpt-oss-120b (standard), qwen3.8-27b (vision)
- [x] Plans $9/180, $29/600, $60/1400 credits per month
- [x] One-time credits: any amount from $15, no cap, presets to $500 with up to 15% bonus
- [x] GitHub push/pull in Imagine Engine
- [x] Click-to-drop map pins, quick canvas Background button
- [x] LightPaper save: session refresh, offload pasted images, exact error messages
- [ ] Owner: create a new Groq key at console.groq.com/keys and replace GROQ_API_KEY in Supabase secrets
- [ ] 3D Studio: Content tab sliders for 3D scenes/games (camera, light, fog, speed) via postMessage to blocks
- [ ] Flow steps: liveDataQuery (realtime), smartSearch (fuzzy), aiSearch, aggregateData
- [ ] Integrate 3D Studio into Imagine Engine (embed level as canvas block; cloud levels table)

## Live Video upgrade
- [x] Full-screen adaptive video layout, pin + speaker suggestion, right-side gallery
- [x] Host mic/camera/stage controls, audience mode
- [x] Startup Factory packages in Shop tab with images
- [x] Direct Stripe checkout for viewers

## Live Video: guests + backgrounds
- [x] Guest check-in form (name, email, startup/investor) before joining; saved to database
- [x] Admin panel "Live Guests" tab with search, filter, CSV export
- [x] Video backgrounds: blur, sample images, custom upload
- [x] Screen share + shared files visible to everyone in Live Video

## Plaza / 3D Studio plan (Oct 2026)
- [x] District chat inside the Genius bubble (Plaza)
- [x] Multiplayer: idle-player cleanup on top of live LiveKit sync
- [x] Plaza lawn theater: admin screen share + PDF/image presenter with page turns
- [ ] Sketchfab library search + spawn in 3D Studio and Imagine Engine (needs a Sketchfab API token)
- [ ] Upload models from computer by drag-and-drop into 3D Studio
- [ ] Imagine AI "Build in 3D" creates an editable 3D Studio level; Dev/Flow wired to it
- [ ] Genius 3D Copilot button that knows the current scene

## 3D Studio integration
- [x] Sketchfab model library (search, filters, add to scene)
- [x] Drop model files onto the 3D Studio
- [x] Genius 3D tab in the Genius bubble (scene-aware edits, scripts)
- [x] Imagine AI 3D requests open/drive the 3D Studio; scene syncs to Dev tab scenes/level.json both ways
- [x] Plaza District editable level + Publish Plaza (admin) / Publish level
- [ ] Live test Sketchfab downloads, Genius 3D and Plaza publishing after publishing the site

- [x] Plaza screen share black for viewers (hidden video stopped decoding)
- [x] 3D Studio theater screens (screen + document), Genius 3D / Imagine AI aware
- [x] New Flow 3D steps: scale, rotate, spin, visible, camera, light, theater
- [x] Zip model reader (Sketchfab zips + uploads)
- [ ] Studio theater screens are local only (viewers of published levels do not see the share yet)
- [x] Character controllers: keyboard/mouse, click-to-move, follow-path, on-screen joystick toggle, hero preset, AI controller op, IE.controls SDK

## Linked accounts
- [x] Merge accounts: from the Switch account button, sign in to each account to link (proof of ownership); startups can be linked
- [x] Switch between linked accounts from the dashboard
- [x] Search/Network: show one card per linked person (best profile) with an icon per account type; startup accounts stay separate
- [x] Email template asking users to finish their profile and add a photo

## Imagine Engine phases 2 and 3
 
- [x] End-to-end streaming with incremental completed-file application
- [x] Bounded continuation for truncated multi-file output
- [x] Structured records, atomic safe fuzzy patches and relevance-ranked context
- [x] 25 regression tests, service deployment, anonymous rejection and browser file/patch validation
- [ ] Signed-in provider generation: blocked by external unmanaged Supabase authentication

## Equity program marketing banner
- [ ] Create branded moving-rover banner with 1–10% equity and idea-to-investable-company message
- [ ] Add GIF and JPG downloads to /marketing and verify exports
