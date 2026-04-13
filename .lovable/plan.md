

## BayesForge: Enrich Analysis with Application Data

### Problem
BayesForge currently operates in isolation -- it only uses the free-text input fields (idea, domain, region, constraints) and sends them to the AI. It ignores all the real data already stored in the platform: companies, investments, investor profiles, accelerator programs, cohort data, etc. This makes the analysis generic rather than contextual.

### Plan

**1. Fetch user's company data on the frontend** (`BayesForgeEngine.tsx`)
- When the component mounts, query `companies` table for the logged-in user's company (name, industry, stage, funding_amount, team_size, founded_year, location, looking_for, description)
- Also query `investments` for the user's company to get funding history (amounts, rounds, investor count)
- If the user has a company, auto-populate the idea/domain/region fields from the company data
- Add a toggle/checkbox: "Include my company data in analysis" (on by default if company exists)

**2. Gather platform-wide market intelligence** (`bayesforge-analyze` edge function)
- Accept a new `companyContext` object in the request body containing the user's company profile and investment data
- Query aggregate platform stats using Supabase service role inside the edge function:
  - Count of companies in the same industry
  - Average funding amounts by stage in that industry
  - Number of active investors with matching preferred industries
  - Accelerator cohort data for the domain
- This gives the AI real market benchmarks instead of guessing

**3. Enhance the AI prompt with real data** (`bayesforge-analyze` edge function)
- Append a new section to the user prompt with the collected data:
  - "Company Profile: [name, stage, team_size, funding, founded_year]"
  - "Funding History: [rounds, amounts, valuations]"
  - "Platform Market Data: [X companies in same industry, avg funding $Y at stage Z, N active investors in this space]"
- Instruct the AI to use this data to calibrate its projections and risk scores

**4. Pass auth context** (`BayesForgeEngine.tsx`)
- Send the user's auth token with the edge function call (already handled by supabase client)
- In the edge function, use the service role key to query aggregate data server-side

### Files Modified
- `src/components/bayesforge/BayesForgeEngine.tsx` -- fetch user's company + investments, auto-fill fields, send `companyContext` to edge function
- `supabase/functions/bayesforge-analyze/index.ts` -- accept `companyContext`, query platform aggregates with service role, enrich AI prompt with real data

### Technical Details
- The edge function will use `createClient` with `SUPABASE_SERVICE_ROLE_KEY` to query aggregate stats (counts and averages only, no PII)
- Company context is optional -- BayesForge still works without a company profile
- Platform stats are summarized as aggregates to keep the prompt concise and avoid token waste

