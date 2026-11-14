/**
 * Page library: every brochure whose pages can be reused as templates.
 * Template copies go through the design-only embed (?bsTemplate=1): the
 * layout, colors, animations and 3D carry over, but the real words are
 * replaced with lorem ipsum and logos are removed.
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
/** Design-only template copy of a page: same layout, colors and shapes,
 *  but the real words are replaced with lorem ipsum and logos removed —
 *  members can reuse the design without taking the brochure's content. */
export const templateEmbedUrl = (route: string, page: number) => `${route}?bsEmbed=${page}&bsTemplate=1`;
export const countUrl = (route: string) => `${route}?bsCount=1`;
export const isEmbed = () => typeof window !== 'undefined' && /[?&]bs(Embed|Count)=/.test(window.location.search);
