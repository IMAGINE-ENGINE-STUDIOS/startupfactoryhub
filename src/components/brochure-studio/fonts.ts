/**
 * Brochure Studio fonts (adapted from Flip Builder V3). Credits: Imagine Engine Studios Corp.
 * FLIP V3 — 50 modern font pairings (display + body), all Google Fonts.
 * `google` is the css2 family query; fonts load lazily, only when a pairing
 * is previewed or used (see loadFlipFonts), so the catalogue costs nothing up front.
 */

export type FlipFontStyle = {
  id: string;
  name: string;
  group: "Editorial" | "Luxury" | "Grotesk" | "Geometric" | "Display" | "Humanist" | "Technical";
  display: string;
  text: string;
  google: string[];
};

const f = (
  id: string, name: string, group: FlipFontStyle["group"],
  display: string, text: string, dFallback = "serif", tFallback = "sans-serif",
): FlipFontStyle => ({
  id, name, group,
  display: `'${display}', ${dFallback}`,
  text: `'${text}', ${tFallback}`,
  google: Array.from(new Set([display, text])),
});

export const FLIP_FONT_STYLES: FlipFontStyle[] = [
  // Editorial
  f("f-fraunces", "Fraunces Review", "Editorial", "Fraunces", "Inter Tight"),
  f("f-newsreader", "Newsreader", "Editorial", "Newsreader", "Source Sans 3"),
  f("f-dmserif", "DM Serif Journal", "Editorial", "DM Serif Display", "DM Sans"),
  f("f-instrument", "Instrument", "Editorial", "Instrument Serif", "Instrument Sans"),
  f("f-lora", "Lora Letter", "Editorial", "Lora", "Nunito Sans"),
  f("f-libre", "Libre Gazette", "Editorial", "Libre Baskerville", "IBM Plex Sans"),
  f("f-spectral", "Spectral Essay", "Editorial", "Spectral", "Manrope"),
  f("f-sourceserif", "Source Serif", "Editorial", "Source Serif 4", "Source Sans 3"),
  f("f-merri", "Merriweather Press", "Editorial", "Merriweather", "Mulish"),
  f("f-crimson", "Crimson Novel", "Editorial", "Crimson Pro", "Work Sans"),
  // Luxury
  f("f-bodoni", "Bodoni Moda", "Luxury", "Bodoni Moda", "Jost"),
  f("f-cormorant", "Cormorant Atelier", "Luxury", "Cormorant", "Montserrat"),
  f("f-italiana", "Italiana Couture", "Luxury", "Italiana", "Raleway"),
  f("f-cinzel", "Cinzel Monument", "Luxury", "Cinzel", "Lato"),
  f("f-marcellus", "Marcellus Gallery", "Luxury", "Marcellus", "Figtree"),
  f("f-playfairsc", "Playfair Salon", "Luxury", "Playfair Display SC", "Karla"),
  f("f-gilda", "Gilda Boutique", "Luxury", "Gilda Display", "Lato"),
  f("f-ebgaramond", "EB Garamond", "Luxury", "EB Garamond", "Inter"),
  // Grotesk
  f("f-spacegrotesk", "Space Grotesk", "Grotesk", "Space Grotesk", "Inter", "sans-serif"),
  f("f-schibsted", "Schibsted", "Grotesk", "Schibsted Grotesk", "Schibsted Grotesk", "sans-serif"),
  f("f-hanken", "Hanken Studio", "Grotesk", "Hanken Grotesk", "Hanken Grotesk", "sans-serif"),
  f("f-familjen", "Familjen", "Grotesk", "Familjen Grotesk", "Inter", "sans-serif"),
  f("f-bricolage", "Bricolage", "Grotesk", "Bricolage Grotesque", "DM Sans", "sans-serif"),
  f("f-archivo", "Archivo Swiss", "Grotesk", "Archivo", "Archivo", "sans-serif"),
  f("f-onest", "Onest", "Grotesk", "Onest", "Onest", "sans-serif"),
  // Geometric
  f("f-outfit", "Outfit Figtree", "Geometric", "Outfit", "Figtree", "sans-serif"),
  f("f-sora", "Sora Manrope", "Geometric", "Sora", "Manrope", "sans-serif"),
  f("f-urbanist", "Urbanist Epilogue", "Geometric", "Urbanist", "Epilogue", "sans-serif"),
  f("f-jakarta", "Plus Jakarta", "Geometric", "Plus Jakarta Sans", "Plus Jakarta Sans", "sans-serif"),
  f("f-lexend", "Lexend", "Geometric", "Lexend", "Lexend", "sans-serif"),
  f("f-redhat", "Red Hat", "Geometric", "Red Hat Display", "Red Hat Text", "sans-serif"),
  f("f-albert", "Albert Sans", "Geometric", "Albert Sans", "Albert Sans", "sans-serif"),
  f("f-poppinsless", "Readex", "Geometric", "Readex Pro", "Readex Pro", "sans-serif"),
  // Display
  f("f-syne", "Syne Jakarta", "Display", "Syne", "Plus Jakarta Sans", "sans-serif"),
  f("f-bebas", "Bebas Barlow", "Display", "Bebas Neue", "Barlow", "sans-serif"),
  f("f-archivoblack", "Archivo Black", "Display", "Archivo Black", "Hind", "sans-serif"),
  f("f-abril", "Abril Fatface", "Display", "Abril Fatface", "Cabin"),
  f("f-anton", "Anton Poster", "Display", "Anton", "Roboto Flex", "sans-serif"),
  f("f-unbounded", "Unbounded", "Display", "Unbounded", "Inter", "sans-serif"),
  f("f-dela", "Dela Gothic", "Display", "Dela Gothic One", "Work Sans", "sans-serif"),
  f("f-oswald", "Oswald Headline", "Display", "Oswald", "Open Sans", "sans-serif"),
  // Humanist
  f("f-worksans", "Work Sans", "Humanist", "Work Sans", "Work Sans", "sans-serif"),
  f("f-karla", "Karla", "Humanist", "Karla", "Karla", "sans-serif"),
  f("f-nunito", "Nunito Soft", "Humanist", "Nunito", "Nunito Sans", "sans-serif"),
  f("f-mulish", "Mulish", "Humanist", "Mulish", "Mulish", "sans-serif"),
  f("f-cabin", "Cabin", "Humanist", "Cabin", "Cabin", "sans-serif"),
  // Technical
  f("f-jetbrains", "JetBrains Sheet", "Technical", "JetBrains Mono", "Work Sans", "monospace"),
  f("f-spacemono", "Space Mono Rubik", "Technical", "Space Mono", "Rubik", "monospace"),
  f("f-plexmono", "IBM Plex", "Technical", "IBM Plex Mono", "IBM Plex Sans", "monospace"),
  f("f-dmmono", "DM Mono", "Technical", "DM Mono", "DM Sans", "monospace"),
];

const loaded = new Set<string>();

/** Inject one stylesheet per family the first time it is needed. */
export const loadFlipFonts = (families: string[] | undefined) => {
  if (typeof document === "undefined" || !families?.length) return;
  const missing = families.filter((fam) => !loaded.has(fam));
  if (!missing.length) return;
  missing.forEach((fam) => loaded.add(fam));
  const q = missing.map((fam) => `family=${fam.replace(/ /g, "+")}:wght@300;400;600`).join("&");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${q}&display=swap`;
  document.head.appendChild(link);
};

/** Font css for a style id (display face for titles, text face otherwise). */
export const fontCss = (id?: string, body = false) => {
  const s = FLIP_FONT_STYLES.find((x) => x.id === id);
  if (!s) return undefined;
  loadFlipFonts(s.google);
  return body ? s.text : s.display;
};
