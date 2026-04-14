

## Brochure: Add Subscription Tiers + Role-Specific Feature Pages

### What Changes

**1. Add 2 missing features to the Platform Features page (Page 4)**
- **Video Conference** — Built-in video conferencing for mentor sessions, pitch practice, and team meetings
- **Events** — Host and attend virtual/hybrid events, workshops, and demo days

**2. New Page: Membership Tiers (insert after Platform Features, before User Profiles)**
- Display the 6 subscription tiers from the existing `MembershipTiers` component data: Free, Community, Self-Paced + Office, Global Access, Corporate, In-Person Cohort
- Each tier shown as a compact card with: name, price, target audience, and key included features (bullet list)
- 2x3 grid layout fitting one A4 page

**3. New Page: Features by Role (insert after User Profiles)**
- One full A4 page showing what each stakeholder type gets from the platform
- 5 role columns: **Investors**, **Accelerators**, **Mentors/Advisors**, **Students**
- Each column lists 4-5 role-specific features with icons (e.g., Investors get: Deal Flow, Portfolio Tracking, Startup Analytics, Direct Messaging; Mentors get: Session Management, Mentee Matching, Goal Tracking, Knowledge Base)
- Compact table/grid layout with color-coded headers per role

### Page Order After Changes
1. Cover
2. The Problem
3. The Solution
4. Platform Features (now with 9 features: +Video Conference, +Events)
5. **Membership Tiers** (NEW)
6. User Profiles / Startup Journey
7. **Features by Role** (NEW)
8. Partners & Network
9. Track Record & Events
10. Contact / CTA

### Files Modified

- **`src/pages/Brochure.tsx`**:
  - Page 4: Add Video Conference and Events to the features grid (now 9 items in a 3x3 grid)
  - Insert new `PageContainer` for Membership Tiers page with 2x3 grid of tier cards sourced from the existing `tiers` data in `MembershipTiers.tsx`
  - Insert new `PageContainer` for Features by Role page with 4-5 columns showing role-specific feature lists
  - Reorder pages accordingly

### Content Details

**Membership Tier Cards** — each card includes:
- Tier name + icon + monthly price
- Target audience line
- 4-5 key included features as bullet points
- Color-coded border matching the tier's gradient

**Features by Role:**
- **Investors**: Deal Flow Pipeline, Portfolio Dashboard, Startup Analytics, Due Diligence Tools, Direct Founder Access
- **Accelerators**: Cohort Management, Program Builder, KPI Dashboards, Mentor Assignment, Demo Day Tools
- **Mentors/Advisors**: Session Scheduling, Mentee Matching, Goal Tracking, Feedback System, Knowledge Sharing
- **Students**: Learning Paths, Project-Based Practice, Mentor Access, Community Forums, Certification Programs

