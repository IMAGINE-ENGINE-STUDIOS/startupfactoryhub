# Investor Q&A tab on the startup profile

Add a new "Investor Q&A" tab to the startup profile where founders answer the standard questions investors ask, and investors can read the answers.

## What the founder sees

A new tab next to About / Details / Pitch Deck / Team / Posts, showing 8 collapsible sections:

1. Market & Opportunity — TAM/SAM/SOM, demand trend, why now
2. Product & Traction — problem/customer, traction, key metrics (CAC, LTV, churn, activation), defensibility
3. Business Model — revenue model, unit economics, path to profitability
4. Team — why this team, founder experience, hires made and still needed
5. Competition — direct/indirect competitors, sustainable advantage, why incumbents can't copy
6. Go-to-Market — acquisition, channels that work and scale, sales cycle
7. Financials & Funding — raise amount and runway, milestones unlocked, past capital use, cap table / valuations / investor rights
8. Risk & Vision — what could kill the business, regulatory/technical/market risks, 5-10 year success

Each question is a text area that autosaves per question. A completion meter at the top shows "x / 26 answered" so founders can see what's missing. Unanswered questions show a muted "Not answered yet" state.

## What investors see

The same tab, read-only, on the public/company profile view. Only answered questions render; empty ones are hidden so the tab never looks unfinished to an investor.

## Technical notes

- New table `company_investor_qa` (company_id, question_key, answer, updated_at) with a unique constraint on (company_id, question_key). Grants + RLS: owners of the company can insert/update/delete/select their own rows; authenticated users can read all rows (answers are meant to be seen by investors). Explicit GRANTs for `authenticated` and `service_role`.
- Question catalog lives in a single config file (`src/lib/investorQuestions.ts`) as sections + questions with stable keys, so wording changes never orphan stored answers.
- New component `src/components/startup/InvestorQATab.tsx` with an `editable` prop; reused for both the founder (editable) and investor (read-only) views.
- Wired into `src/components/CompanyProfileManager.tsx`: one entry in `profileTabs` (icon: `HelpCircle`) plus a matching `TabsContent`.
- Styling follows the existing `tech-card border-0` glass pattern and Lucide icons only.
