# Roadmap

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
