## Brochure: Convert to Vertical A4 with Rich Feature Details

### What Changes

**1. Vertical A4 format** — Switch from landscape (1190x842) to portrait (842x1190) throughout:

- `A4Wrapper` aspect ratio becomes `842/1190`, base dimensions `842x1190`
- PDF export uses `portrait` orientation with `[842, 1190]` format
- All scaling math updated accordingly

**2. Richer, more detailed Platform Features** — Instead of a compact 2x3 grid with 1-line descriptions, dedicate a full page (or two pages) to features, explaining each one individually with:

- Larger icon + title
- 3-4 sentence description of what the feature does, who it serves, and why it matters
- 2-column layout (3 features per page across 2 pages = 6 features total), each feature getting a full card with meaningful content

**3. Content redistribution for portrait format** — With more vertical space per page, sections can breathe more. Specifically:

- Cover: vertically centered, logo larger
- Problem/Solution: content stacks naturally in portrait
- User Profiles: 2x4 grid instead of 1x8
- Partners: wider logo cards in a 4-5 column grid
- Events: 2-3 column layout instead of 5 columns (cards get more room)
- All font sizes can increase slightly since portrait pages have more vertical room

### Files Modified

- `**src/pages/Brochure.tsx**` — Full rewrite of layout:
  - `A4Wrapper`: change dimensions to 842x1190 (portrait), aspect ratio `842/1190`
  - `handleExportPDF`: change to `orientation: 'portrait'`, format `[842, 1190]`
  - Section 4 (Platform Features): expand to 1-2 full pages with detailed per-feature cards (2-column layout, 3 per page), each with icon, title, and a thorough 3-4 sentence explanation
  - All grid layouts adjusted for narrower/taller proportions (e.g., events go from 5-col to 2-col, profiles from 8-col to 4-col, partners from 6-col to 4-col)
  - Increase text sizes where appropriate for print readability

### Feature Descriptions (for the expanded Platform Features pages)

Each feature card will include:

1. **AI Strategies** — Smart growth recommendations powered by machine learning. The AI engine analyzes your startup's stage, market position, and competitive landscape to generate actionable strategy roadmaps. Continuously adapts recommendations as your business evolves.
2. **Business Intelligence** — Real-time analytics dashboards with market insights, KPI tracking, and performance benchmarks. Compare your metrics against industry averages from platform data. Automated reporting for investors and stakeholders.
3. **Resources Map** — Interactive global directory of 5,800+ partner locations, coworking spaces, accelerators, and service providers. Filter by industry, location, and resource type. Exclusive perks and discounts for platform members.
4. **Startup Journey** — Guided execution path from idea validation through market scale. AI-generated milestones, task lists, and progress tracking. Each stage unlocks relevant tools, mentors, and resources automatically.
5. **Mentorship** — AI-matched mentors and advisors with verified domain expertise. Structured engagement with scheduled sessions, goal tracking, and feedback loops. Access to a global network of operators who have built and scaled companies.
6. **Investor Match** — Smart investor matching based on industry, stage, ticket size, and thesis alignment. Integrated pitch preparation tools, data room management, and warm introduction workflows. Track fundraising pipeline in one place.
7. **Inteligence Engine** 
  Probabilistic startup modeling and AI reasoning engine. 