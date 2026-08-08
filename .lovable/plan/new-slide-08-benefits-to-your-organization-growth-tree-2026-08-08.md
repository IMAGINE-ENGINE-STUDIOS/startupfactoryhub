# New Slide 08 — "Benefits to Your Organization" (Growth Tree)

A new page inserted right after the Capability Matrix (slide 07) in the Accelerator as a Service brochure, built around an original animated growth organism: a tree that grows as the partnership deepens.

## The visual idea

A living, elegant tree drawn with SVG, animated so it visibly *grows* on screen:

- Roots (bottom) labeled with what the partner brings: brand, capital, market access, mandate.
- Trunk = the partnership with Startup Factory Hub, with a slow luminous "sap" pulse traveling upward.
- Branches grow outward one by one (stroke-draw animation), each ending in a glowing node.
- Leaves/fruit fade and scale in along the branches, plus a few slow-drifting light particles (spores/pollen) for depth.
- A subtle "growth timeline" scrubber under the tree: Year 0 → Year 1 → Year 2 → Year 3. Hovering or auto-cycling advances the stage, and the tree gains branches, leaves and light with each stage. Counters next to it tick up (startups supported, innovation projects, ecosystem reach, deal flow).

Not a stock chart, not a generic infographic — a hand-crafted organic system in the brochure's neon-on-light aesthetic (lime/emerald accent, matching the matrix page), with soft glow filters, gradient strokes and refined motion easing.

## Content on the slide

Kicker: `08 · Benefits to Your Organization`
Title: "Your organization **grows** with the ecosystem."

Six benefit nodes anchored to branches (short label + one line each), themed to a general-partner audience:

1. Innovation pipeline — continuous access to vetted, buildable ventures.
2. Brand equity — positioned as the innovation anchor of the region/sector.
3. Talent & culture — teams exposed to startup velocity and modern tooling.
4. Deal flow & optionality — early sight of investable companies.
5. Ecosystem gravity — mentors, investors and partners orbiting your name.
6. Measurable impact — jobs, ventures and capital mobilized, reported.

Left column holds the narrative + benefit list; the tree occupies the right / center stage. On mobile the tree stacks above the list.

## Technical notes

- Edit `src/pages/AcceleratorBrochure.tsx` only, plus one new component file `src/components/brochure/GrowthTree.tsx` for the animated SVG (keeps the brochure file from growing further).
- Insert a new `BookPage` + `A4Wrapper` + `PageFrame` block after the current page 7 block, accent `NEON.lime` (or `NEON.cyan` for contrast with the matrix page — will use emerald/lime family for the organic theme).
- Renumber the following pages: Digital Platform 08→09, AR 09→10, Global Visibility 10→11, Engage 11→12, and update the `P/xx · 12` denominator in `PageFrame` and the hardcoded `P/02 · 12` to `13`.
- Animation with Framer Motion (already used) + CSS keyframes for the sap pulse and particle drift; respects `prefers-reduced-motion` by rendering the fully-grown final state without looping motion.
- No new dependencies, no backend changes.
