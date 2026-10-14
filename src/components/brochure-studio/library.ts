/**
 * Page library: every brochure whose pages can be reused as templates.
 * A page is reused live through its embed link (?bsEmbed=<page>), so it keeps
 * its design, animations, 3D and published edits.
 * Credits: Imagine Engine Studios Corp.
 */
export const BROCHURES: { route: string; name: string }[] = [
  { route: '/forpartners', name: 'Partners' },
  { route: '/apex', name: 'APEX' },
  { route: '/forstartups', name: 'Startups (MVP)' },
  { route: '/wtcbrochure', name: 'World Trade Center' },
  { route: '/bdvbrochure', name: 'BDV' },
  { route: '/brochure', name: 'Startup Factory Hub' },
  { route: '/brochurees', name: 'Startup Factory Hub (ES)' },
  { route: '/brochure-academia', name: 'Academia' },
  { route: '/basic-plan', name: 'Membership' },
  { route: '/investor-plan', name: 'Investor plan' },
  { route: '/parasocios', name: 'Socios' },
];

export const embedUrl = (route: string, page: number) => `${route}?bsEmbed=${page}`;
export const countUrl = (route: string) => `${route}?bsCount=1`;
export const isEmbed = () => typeof window !== 'undefined' && /[?&]bs(Embed|Count)=/.test(window.location.search);
