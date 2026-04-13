

## BayesForge UI Fixes

### Issues
1. **Overall Risk card is too tall** — the score display has excessive vertical spacing making the card disproportionately long compared to the Risk Matrix card next to it
2. **Fullscreen dialog doesn't show results** — the fullscreen Dialog renders a new `<BayesForgeEngine />` instance, which starts with a fresh empty state (no results), losing any analysis already run in the inline view

### Plan

**1. Fix Overall Risk card height** (`BayesForgeRiskPanel.tsx`)
- Make the score display more compact: reduce the `text-4xl` score to `text-3xl`, tighten `space-y-2` to `space-y-1`, reduce padding
- This keeps both cards in the top row visually balanced

**2. Fix fullscreen showing results** (`AIFeaturesHub.tsx` + `BayesForgeEngine.tsx`)
- Lift the BayesForge state (result, idea, domain, region, constraints, activeTab) up from `BayesForgeEngine` into `AIFeaturesHub` so both the inline and fullscreen views share the same state
- Pass state as props to `BayesForgeEngine` so the fullscreen dialog renders the same results
- Alternative simpler approach: instead of two separate instances, keep a single `BayesForgeEngine` and use a ref or portal — but lifting state is cleaner

### Files Modified
- `src/components/bayesforge/BayesForgeRiskPanel.tsx` — compact the Overall Risk card
- `src/components/bayesforge/BayesForgeEngine.tsx` — accept optional props for shared state
- `src/components/AIFeaturesHub.tsx` — lift BayesForge state up and pass to both instances

