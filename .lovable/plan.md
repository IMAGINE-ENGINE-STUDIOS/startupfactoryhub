## Brochure Page Plan — `/brochure`

### Overview

Create a horizontal A4 brochure page at `/brochure` — a multi-section, landscape-oriented layout reusing the Deck's dark tech aesthetic (TechGrid, FloatingHexagons, EnergyLines, CornerAccents, TechCard, IconBadge, SectionDivider) and the marketing banner's scan-effect styling. Professional Lucide icons only, no emojis. PDF export via html2canvas + jsPDF (landscape A4).

### Page Structure (8 sections, each a full landscape A4 "page")

Each section renders at **1190x842** (A4 landscape ratio) using the same `SlideWrapper` scaling pattern from Deck.tsx, adapted for A4 proportions.

**Section 1 — Cover**

- SFH logo with glow + orbit ring, title "Startup Factory Hub", subtitle "The Online Hybrid Accelerator Platform Powered by A.I.", tagline, 4 hub locations

**Section 2 — The Problem**

- Broken journey visualization (reuse Deck slide 3 content/style)
- 5 core gaps with numbered cards
- Rose-accented border frame

**Section 3 — The Solution**

- "Not a 3-month program" statement
- 4 pillars: A.I Business Inteligence Engine, Education, Digital + Physical Hybrid, Integrated Ecosystem
- 4 mechanism cards: Digital Infrastructure, Human Expertise, Corporate Partners, Capital Access

**Section 4 — Platform Features**

- 2x3 grid of TechCards: AI Strategies, Business Intelligence, Resources Map, Startup Journey, Mentorship, Investor Match
- Product mockup screenshots arranged as floating screens

**Section 5 — User Profiles**

- 8 stakeholder types in a grid (Startups, Investors, Mentors, Advisors, Students, Accelerators, Corporates, Admins)
- Startup Journey Roadmap timeline (6 steps from Idea to Scale)

**Section 6 — Partners & Network**

- Logo grid of all partners (NASA, Google, HSBC, Nasdaq, GitHub, NVIDIA, etc.)
- Category tags: Technology, Investment, Academic, Marketplace, Legal, Community

**Section 7 — Track Record & Events**

- 4 event cards side-by-side:
  - Accelerating Research & Technology Developemnt - (with NASA  TTP at KSC)
  - **Hot Deals in Space** (with NASA TTP) — space event banner style, NASA logo
  - **Artemis II Watch Party** (with NASA) — Artemis branding
  - **Orlandopreneur** collaboration event
  - **Upcoming:** Space Sympotium feature in Time Squere XR Exeprience. 
- Each card: event image/bg, title, partner logos, brief description
- Uses event background assets (`space-event-bg.png`, `artemis-banner-bg.webp`, `event-bg-*.jpg`)

**Section 8 — Contact / CTA**

- "Join Our Mission" with email, logo, website URL
- Global hubs highlight

### Technical Details

**Files created:**

- `src/pages/Brochure.tsx` — main page component with all 8 sections, reusing Deck's visual components (TechGrid, FloatingHexagons, EnergyLines, CornerAccents, TechCard, IconBadge, SectionDivider) copied/imported inline
- Landscape A4 wrapper: 1190x842 base resolution with `ResizeObserver` scaling (same pattern as Deck's `SlideWrapper`)

**Files modified:**

- `src/App.tsx` — add lazy import for Brochure and `/brochure` route

**Key design decisions:**

- A4 landscape aspect ratio (`aspect-[1190/842]`) instead of 16:9
- Same dark slate-950 background, teal/cyan/emerald accent palette
- Same geometric overlays (hexagons, tech grid, energy lines, corner accents)
- PDF export button using html2canvas + jsPDF with A4 landscape format
- All partner logos sourced from the same URLs used in Deck.tsx
- Event cards use existing asset images for backgrounds
- Navigation bar at top with Home button + Export PDF (matching Deck nav style)