/**
 * Page library: every brochure whose pages can be reused as templates.
 * Template copies go through the design-only embed (?bsTemplate=1): the
 * layout, colors, animations and 3D carry over, but the real words are
 * replaced with lorem ipsum and logos are removed.
 * Credits: Imagine Engine Studios Corp.
 */
/** Library names are GENERIC on purpose (founder, 2026-11-14): users must
 *  not be able to tell whose real brochure a template design came from,
 *  so the library never shows the real book names — Template Book N only.
 *  The real brochures keep their real names at their own routes. */
export const BROCHURES: { route: string; name: string }[] = [
  { route: '/forpartners', name: 'Template Book 1' },
  { route: '/apex', name: 'Template Book 2' },
  { route: '/forstartups', name: 'Template Book 3' },
  { route: '/wtcbrochure', name: 'Template Book 4' },
  { route: '/bdvbrochure', name: 'Template Book 5' },
  { route: '/brochure', name: 'Template Book 6' },
  { route: '/brochurees', name: 'Template Book 7' },
  { route: '/brochure-academia', name: 'Template Book 8' },
  { route: '/basic-plan', name: 'Template Book 9' },
  { route: '/investor-plan', name: 'Template Book 10' },
  { route: '/parasocios', name: 'Template Book 11' },
];

export const embedUrl = (route: string, page: number) => `${route}?bsEmbed=${page}`;
/** Design-only template copy of a page: same layout, colors and shapes,
 *  but the real words are replaced with lorem ipsum and logos removed —
 *  members can reuse the design without taking the brochure's content. */
export const templateEmbedUrl = (route: string, page: number) => `${route}?bsEmbed=${page}&bsTemplate=1`;
export const countUrl = (route: string) => `${route}?bsCount=1`;
export const isEmbed = () => typeof window !== 'undefined' && /[?&]bs(Embed|Count)=/.test(window.location.search);
