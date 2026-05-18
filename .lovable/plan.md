# Import SBIC Investors into the Investor Network

Import the 396 SBIC fund contacts from `sbic_contacts_1.csv` into the database and surface them in the Investor Network alongside the existing platform investors.

## What you'll get

- A new **Directory Investors** table holding all 396 SBIC funds (firm name, manager, city/state, vintage, fund size, average investment, strategy, fund style, accepting new investments, IR contact).
- The Investor Network screen (`StartupInvestorNetwork`) shows these directory investors below your real platform investor connections, clearly labeled "Directory" so they're not confused with users on the platform.
- Filters: search by name / state / strategy, toggle "Accepting new investments only".
- Each directory card shows: fund name, manager, location, vintage, fund size, average check, strategy, an "Open to new investments" badge, plus a **Contact** button that opens the IR email (mailto with prefilled subject from the user's startup).
- No fake users are created (clean separation from real auth accounts, no notifications, no pitch booking — these contacts aren't on the platform).

## Approach

1. **Schema** (`directory_investors` table):
   - Columns: name, city, state, manager, vintage_year, fund_size, average_investment, investment_strategy, fund_style, accepting_investments (bool), ir_name, ir_email, ir_phone, source (`'SBIC'`).
   - RLS: read for any authenticated user; write only for admins.
2. **Import**: bulk insert the 396 rows via the data-insert tool (parsed from the CSV). Empty numeric cells become NULL; "Yes/No" → boolean.
3. **UI**: extend `StartupInvestorNetwork.tsx` with a new "Investor Directory" section underneath the existing network grid. New component `InvestorDirectoryList` handles fetch + filter + render using existing `tech-card` glassmorphism styling and Lucide icons (Building2, MapPin, DollarSign, Mail, Phone) — no emojis.
4. **Optional later**: same directory could be exposed on the public `/partners` or a `/investors` directory page — not in this scope.

## Technical details

- Table created via `supabase--migration`; data loaded via insert tool after migration approval.
- Fetch hook: `useDirectoryInvestors(filters)` returns paginated results (default 50, "Load more" button).
- Numeric parsing handled at import time (strip commas, treat blanks as NULL).
- Duplicate fund rows in the source (e.g., "Aldine Capital Fund II" appears twice with different vintages) are kept as-is — they're separate SBIC license filings.
- No edit to `useInvestorNetwork` or `InvestorStartupNetwork` (that's for investors viewing startups, unrelated).
