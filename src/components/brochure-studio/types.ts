/**
 * Brochure Studio document model — shared by every flipbook brochure.
 * Credits: Imagine Engine Studios Corp.
 */
export type Anim = '' | 'fade' | 'up' | 'reveal' | 'zoom' | 'pulse' | 'float' | 'glow' | 'spin' | 'bounce' | 'swing' | 'shimmer' | 'hue' | 'shake';
export type Hover = '' | 'lift' | 'grow' | 'glow' | 'tilt';

/** Overrides for an element that already exists in a brochure page. */
export type ElEdit = {
  text?: string; color?: string; bg?: string; hidden?: boolean;
  dx?: number; dy?: number; scale?: number; rot?: number;
  fontSize?: number; opacity?: number; radius?: number; anim?: Anim; z?: number; hover?: Hover; font?: string;
};

export type ItemType = 'image' | 'text' | 'icon' | 'model' | 'shape' | 'page';

/** A page of a Studio-made brochure: blank, or a live copy of another brochure's page. */
export type PageRef = { src?: string; label?: string };

/** Something added on top of a page from the Studio palette. */
export type Item = {
  id: string; page: number; type: ItemType;
  x: number; y: number; w: number; // percent of the page
  rot?: number; opacity?: number; radius?: number; anim?: Anim; z?: number; hover?: Hover;
  src?: string; text?: string; color?: string; bg?: string; size?: number; weight?: number;
  icon?: string; font?: string; iosSrc?: string; ar?: boolean; autoRotate?: boolean; metal?: boolean;
};

export type BgKind = 'none' | 'tree' | 'lab' | 'grid' | 'stars' | 'particles' | 'aurora' | 'waves' | 'matrix';
export type PageBg = {
  kind: BgKind; opacity: number; blend: 'normal' | 'screen' | 'multiply';
  c1?: string; c2?: string; speed?: number; // animation colors and speed
  fill?: 'none' | 'solid' | 'gradient' | 'animated'; f1?: string; f2?: string; angle?: number; deep?: boolean; // page color
};

export type BrochureDoc = {
  edits: Record<string, ElEdit>;
  items: Item[];
  bgs: Record<string, PageBg>; // key = page index or "all"
  pageCount?: number; // only for brochures created in the Studio
  pages?: PageRef[]; // ordered pages of a Studio-made brochure
  title?: string;
};

export const EMPTY_DOC: BrochureDoc = { edits: {}, items: [], bgs: {} };

/** Accepts older saved docs (edits + images) and fills missing fields. */
export function normalizeDoc(d: any): BrochureDoc {
  if (!d || typeof d !== 'object') return { ...EMPTY_DOC };
  const legacy: Item[] = Array.isArray(d.images)
    ? d.images.map((i: any) => ({ id: i.id, page: i.page, type: 'image', x: i.x, y: i.y, w: i.w, src: i.src, radius: 10 }))
    : [];
  return {
    edits: d.edits || {},
    items: [...(Array.isArray(d.items) ? d.items : []), ...legacy],
    bgs: d.bgs || {},
    pageCount: d.pageCount,
    pages: Array.isArray(d.pages) ? d.pages : undefined,
    title: d.title,
  };
}
