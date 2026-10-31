/**
 * Feed image helpers — organization logos vs real post photos.
 *
 * Featured-organization posts (e.g. the daily FEATURED FUND posts) carry
 * the organization's LOGO as their only media. Logos are small, often
 * square files (Google's favicon service tops out well below photo
 * sizes), so rendering them like photos — full-width, object-cover —
 * stretches them into a huge blurry blow-up (founder screenshot,
 * 2026-10-31: a 128px Pegasus favicon blown up full-bleed, and the
 * lightbox collapsing into a narrow strip around it).
 *
 * Rule: logo-like images are shown CONTAINED, at a sensible size,
 * centred on a clean white panel; favicon-service URLs are upgraded
 * to the largest size the service serves so the logo is as sharp as
 * it can be. Real photos keep the normal full-width treatment.
 */

/** True for favicon-service URLs and any URL whose path names a logo/icon. */
export const isLogoImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split('?')[0];
  if (url.toLowerCase().includes('s2/favicons') || clean.endsWith('favicon.ico') || clean.endsWith('favicon.png')) return true;
  return /(^|[/_-])(logo|logos|icon|icons|favicon)([/_-]|$)/.test(clean) || clean.includes('fund-logos') || clean.includes('firm-logos');
};

/**
 * Ask the Google favicon service for its largest rendition (256px)
 * instead of the tiny 32/64/128px versions older posts were saved
 * with. Other URLs pass through untouched.
 */
export const highResLogoUrl = (url: string): string => {
  if (!url || !url.includes('s2/favicons')) return url;
  if (/[?&]sz=\d+/.test(url)) return url.replace(/([?&]sz=)\d+/, '$1256');
  return url + (url.includes('?') ? '&' : '?') + 'sz=256';
};

/** A loaded <img> this small is a logo/icon, whatever its URL says. */
export const isSmallLoadedImage = (img: HTMLImageElement): boolean =>
  img.naturalWidth > 0 && img.naturalWidth <= 256 && img.naturalHeight <= 256;
