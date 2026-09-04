# Accelerated Fundraising Program page (/accelerated-fundraising)

A new program page that mirrors the MVP Program page exactly in structure and design, with a different hero background and content focused on hardware startups in the aerospace industry. It reads its batch data live from the admin dashboard, and a matching batch is created so it shows up there from day one.

## What gets built

1. **New page at `/accelerated-fundraising`**
   - Same layout, sections and components as the MVP Program page: hero, benefit tiles, phase/agenda blocks, open batch cards with "Apply" links, billboard carousel, FAQ/CTA.
   - Different hero background image (new aerospace/hardware visual: launch pad, orbital hardware, dark space tones) so the two pages are visually distinct.
   - Copy rewritten for hardware + aerospace: hardware prototyping, supply chain, certification/compliance, defense and space primes, non-dilutive funding (SBIR/grants), investor readiness for capital-intensive hardware.
   - Benefit tiles reworked to aerospace themes (Prototype & Test, Supply Chain, Certification & Compliance, Primes & Defense Network, Non-Dilutive Capital, Investor Readiness, Demo Day, Platform & AI Stack).

2. **Live sync with the admin dashboard**
   - The page pulls its batches from the same accelerator batch table used by the MVP page, filtered to this program's batch, so any edit made in the admin dashboard (dates, spots, cost, status, industries) appears on the page immediately.
   - Apply button uses the existing application flow (`/cohorts/<id>/apply`), so applications land in the existing admin applications view.

3. **New batch created in the admin dashboard**
   - A batch record is created under the Startup Factory Hub accelerator so it is visible and editable in the admin cohort management screen.
   - Proposed defaults (all editable later in the dashboard):
     - Name: Accelerated Fundraising — Aerospace Hardware Batch 01
     - Focus industries: aerospace, hardware, defense, space
     - Max startups: 20
     - Status: applications open
     - Program cost: free
     - Application deadline / start date: no fixed deadline

## Open questions (defaults used if you don't say otherwise)

- Program cost: free (no application fee)?
- Program length: 4 weeks like the MVP program, or longer for hardware?

## Technical notes

- New file `src/pages/AcceleratedFundraising.tsx` modeled on `src/pages/MVPProgram.tsx`, lazy-loaded route added in `src/App.tsx`.
- New hero asset generated into `src/assets/`.
- Batch query filters `accelerator_cohorts` by the SFH accelerator id plus this program's focus industries / name marker, so the two program pages don't show each other's batches.
- One SQL migration inserts the batch row; no schema changes needed.
- No changes to the MVP Program page, its brochure, or shared components.
