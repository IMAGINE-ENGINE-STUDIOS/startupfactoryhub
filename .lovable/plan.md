

## BayesForge Intelligence Engine -- Integration Plan

### Overview
Add a new collapsible section in the AIFeaturesHub (Tools Dashboard) called "BayesForge Intelligence Engine" -- a probabilistic AI reasoning tool that builds Bayesian models, runs simulations, and generates explainable startup intelligence.

### Architecture

The tool opens as a near-fullscreen dialog (matching Imaginaly pattern) with a multi-step workflow UI.

### Files to Create

**1. `src/components/bayesforge/BayesForgeEngine.tsx`** -- Main component
- Multi-tab interface: Model Builder | Simulation | Risk Analysis | Design Document
- Input form accepting: startup idea, market domain, geographic region, risk factors/constraints
- Calls AI edge function to generate structured outputs
- Renders interactive Bayesian network visualization (D3-based dependency graph)
- Displays probability tables, risk scores, and decision logic

**2. `src/components/bayesforge/BayesForgeNetworkGraph.tsx`** -- Visual Bayesian network
- SVG-based directed acyclic graph showing variable dependencies
- Nodes colored by category (market, financial, environmental, technical)
- Edge weights showing conditional probabilities
- Interactive: click nodes to see details

**3. `src/components/bayesforge/BayesForgeSimulation.tsx`** -- Simulation results panel
- Monte Carlo simulation visualization with distribution charts
- Startup feasibility score with confidence intervals
- Financial projection ranges
- Scenario comparison table

**4. `src/components/bayesforge/BayesForgeRiskPanel.tsx`** -- Risk analysis view
- Risk matrix heatmap
- Factor-by-factor breakdown with scores
- Mitigation suggestions from AI

**5. `src/components/bayesforge/BayesForgeReport.tsx`** -- Explainability/design document
- Structured report with: variables list, dependencies, logical rules, algorithm schema, model summary
- Export as text/copy functionality

**6. `supabase/functions/bayesforge-analyze/index.ts`** -- Edge function
- Accepts startup parameters (idea, domain, region, constraints)
- Calls AI (via Lovable API key) with a structured prompt to generate:
  - Bayesian network structure (nodes + edges with probabilities)
  - Simulation results (feasibility scores, financial projections)
  - Risk scoring framework
  - Decision logic explanation
- Returns structured JSON

### Changes to Existing Files

**`src/components/AIFeaturesHub.tsx`**
- Add new collapsible section for BayesForge (between CRM and AI Tools sections)
- Add BayesForge dialog state management
- Import BayesForgeEngine component
- Add `Brain` icon from lucide-react

### UI Design
- Collapsible card with gradient icon (indigo-to-violet)
- Four action buttons: Run Model, Simulate, Analyze Risk, Export Report
- Near-fullscreen dialog with tabbed workspace
- Input panel on left, results/visualization on right
- Follows existing tech-card styling throughout

### Edge Function Details
- Uses `LOVABLE_API_KEY` (already available) to call AI
- System prompt instructs AI to output structured JSON with Bayesian network schema
- Deterministic output structure for consistent rendering
- CORS headers included for browser access

