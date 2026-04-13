

## BayesForge UI Improvement Plan

### Problems Identified
1. **Network Graph too large** — SVG viewBox is 600x500 with no max-width constraint, fills entire results panel
2. **Monte Carlo Distribution broken** — bar heights use percentage-based CSS but the container uses `flex items-end` with fixed `h-32`; bucket labels use a broken rotation approach (`rotate-[-45deg] origin-top-left`) causing text to clip/disappear
3. **Layout too simple** — results are single-column stacked cards with no visual hierarchy; simulation tab is a long vertical scroll
4. **Poor space distribution** — input panel is narrow (w-80) but results panel has no grid structure

### Plan

**1. Fix BayesForgeNetworkGraph — constrain size and improve layout**
- Add `max-w-lg mx-auto` to the SVG wrapper so the graph doesn't dominate the screen
- Reduce viewBox or add aspect-ratio constraint
- Wrap in a Card with proper padding for visual consistency

**2. Fix BayesForgeSimulation — Monte Carlo + layout overhaul**
- **Fix Monte Carlo chart**: Replace broken CSS rotation labels with properly positioned angled text. Use `min-height` instead of fixed `h-32`. Ensure bars render with correct proportional heights using inline `style={{ height }}` with pixel or percentage values relative to container
- **Grid layout for top metrics**: Place Feasibility Score and Revenue Projections side-by-side in a 2-column grid on desktop (`grid grid-cols-1 lg:grid-cols-2`)
- **Place Monte Carlo and Scenarios side-by-side** in another 2-column grid row

**3. Improve BayesForgeRiskPanel — better distribution**
- Put the overall score and risk matrix side-by-side in a 2-column grid
- Factor cards in a 2-column grid instead of single stack

**4. Polish BayesForgeEngine — results panel structure**
- Add subtle section headers/descriptions within each tab
- Ensure scrollable area has proper padding and max-height behavior

### Files Modified
- `src/components/bayesforge/BayesForgeNetworkGraph.tsx` — constrain SVG size, wrap in Card
- `src/components/bayesforge/BayesForgeSimulation.tsx` — fix Monte Carlo labels/bars, 2-column grid layout
- `src/components/bayesforge/BayesForgeRiskPanel.tsx` — 2-column grid for score+matrix and factors
- `src/components/bayesforge/BayesForgeEngine.tsx` — minor padding/structure adjustments

