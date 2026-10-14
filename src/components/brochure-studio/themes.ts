/**
 * One-click page themes (page colors + animation colors) for Brochure Studio,
 * adapted from Flip Builder V3 palettes to the Startup Factory Hub look.
 * Credits: Imagine Engine Studios Corp.
 */
export type StudioTheme = { id: string; name: string; f1: string; f2: string; c1: string; c2: string };

export const THEMES: StudioTheme[] = [
  { id: 'sfh', name: 'Factory Night', f1: '#0b1220', f2: '#111a2e', c1: '#22d3ee', c2: '#a855f7' },
  { id: 'apex', name: 'Apex Purple', f1: '#0f0a1f', f2: '#3b0764', c1: '#c084fc', c2: '#7c3aed' },
  { id: 'teal', name: 'Deep Teal', f1: '#04161a', f2: '#0e3a44', c1: '#2dd4bf', c2: '#22d3ee' },
  { id: 'graphite', name: 'Graphite', f1: '#0d0f13', f2: '#262b35', c1: '#cbd5e1', c2: '#64748b' },
  { id: 'midnight', name: 'Midnight', f1: '#05070b', f2: '#172554', c1: '#7dd3fc', c2: '#3b82f6' },
  { id: 'ember', name: 'Ember', f1: '#140806', f2: '#431407', c1: '#fb923c', c2: '#f43f5e' },
  { id: 'verdant', name: 'Verdant', f1: '#06120a', f2: '#14532d', c1: '#4ade80', c2: '#22d3ee' },
];
