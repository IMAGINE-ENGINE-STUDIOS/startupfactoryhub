/**
 * Full brochure templates: ordered page sets dropped into a brochure in one move.
 * A kit page is either a layout (built-in design) or a live copy of another brochure's page.
 * Credits: Imagine Engine Studios Corp.
 */
import { LAYOUTS, type Layout } from './layouts';
import { BROCHURES, embedUrl } from './library';

export type KitPage = { label: string; src?: string; layout?: Layout };
export type Kit = { id: string; name: string; note: string; pages: KitPage[] };
export const KIT_MIME = 'application/x-bs-kit';

const L = (id: string): KitPage => { const l = LAYOUTS.find((x) => x.id === id)!; return { label: l.name, layout: l }; };

export const STARTER_KITS: Kit[] = [
  { id: 'kit-pitch', name: 'Pitch deck', note: 'Cover, story, offer, numbers, roadmap, team, next step',
    pages: ['cover-center', 'title-text', 'features', 'stats', 'steps', 'team', 'cta'].map(L) },
  { id: 'kit-editorial', name: 'Editorial magazine', note: 'Magazine cover, two columns, quote, results, closing',
    pages: ['cover-left', 'two-col', 'quote', 'stats', 'cta'].map(L) },
  { id: 'kit-program', name: 'Program overview', note: 'Cover, what we offer, how it works, call to action',
    pages: ['cover-center', 'features', 'steps', 'cta'].map(L) },
];

/** Every APEX proposal page, saved as reusable templates (live copies keep design, 3D and edits). */
export const APEX_PAGES = ['Cover', 'About Startup Factory Hub', 'Where the ecosystem meets', 'Acceleration at scale', 'The opportunity',
  'Resource Hubs I', 'Resource Hubs II', 'Mentors and Advisors', 'Strategic Intelligence', 'Journey Mapping', 'Administrator Management',
  'Corporate Partner Resources', 'Data Analytics', 'National and International Expansion', 'Investor Network', 'Grant and Funding Matching',
  'Global Soft-Landing', 'Impact Reporting', 'White-Label Branding', 'How it works', 'Expected outcomes', 'Implementation', 'Next steps', 'Our team', 'Conclusion'];
export const pageKit = (route: string, i: number, label: string): Kit =>
  ({ id: `kit-page:${route}:${i}`, name: label, note: '1 page', pages: [{ label, src: embedUrl(route, i) }] });
export const APEX_KIT: Kit = { id: 'kit-apex', name: 'APEX proposal', note: `${APEX_PAGES.length} pages: cover, ecosystem, 13 capabilities, plan and team`,
  pages: APEX_PAGES.map((label, i) => ({ label: `APEX · ${label}`, src: embedUrl('/apex', i) })) };
export const findSavedKit = (id: string): Kit | undefined => {
  if (id === APEX_KIT.id) return APEX_KIT;
  const m = id.match(/^kit-page:(.+):(\d+)$/); if (!m) return undefined;
  const i = +m[2]; return pageKit(m[1], i, m[1] === '/apex' ? `APEX · ${APEX_PAGES[i] ?? `P/${i + 1}`}` : `P/${i + 1}`);
};

/** A whole existing brochure as a template (needs its page count). */
export const brochureKit = (route: string, n: number): Kit => {
  const name = BROCHURES.find((b) => b.route === route)?.name || route;
  return { id: `kit-copy:${route}`, name: `${name} brochure`, note: `${n} pages, kept live with their design and 3D`,
    pages: Array.from({ length: n }, (_, i) => ({ label: `${name} P/${i + 1}`, src: embedUrl(route, i) })) };
};

/** Page counts are cached so the library opens instantly next time. */
const COUNT_KEY = 'sfh-bs-page-counts';
export const readCounts = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(COUNT_KEY) || '{}'); } catch { return {}; } };
export const saveCounts = (c: Record<string, number>) => { try { localStorage.setItem(COUNT_KEY, JSON.stringify(c)); } catch { /* ignore */ } };
