/**
 * Brochure Studio document model — shared by every flipbook brochure.
 * Credits: Imagine Engine Studios Corp.
 */
export type Anim = '' | 'fade' | 'up' | 'reveal' | 'pulse' | 'float' | 'glow' | 'spin';

/** Overrides for an element that already exists in a brochure page. */
export type ElEdit = {
  text?: string; color?: string; bg?: string; hidden?: boolean;
  dx?: number; dy?: number; scale?: number; rot?: number;
  fontSize?: number; opacity?: number; radius?: number; anim?: Anim; z?: number;
};

export type ItemType = 'image' | 'text' | 'icon' | 'model' | 'shape';

/** Something added on top of a page from the Studio palette. */
export type Item = {
  id: string; page: number; type: ItemType;
  x: number; y: number; w: number; // percent of the page
  rot?: number; opacity?: number; radius?: number; anim?: Anim; z?: number;
  src?: string; text?: string; color?: string; bg?: string; size?: number; weight?: number;
  icon?: string; ar?: boolean; autoRotate?: boolean; metal?: boolean;
};

export type BgKind = 'none' | 'tree' | 'lab' | 'grid' | 'stars' | 'particles';
export type PageBg = { kind: BgKind; opacity: number; blend: 'normal' | 'screen' | 'multiply' };

export type BrochureDoc = {
  edits: Record<string, ElEdit>;
  items: Item[];
  bgs: Record<string, PageBg>; // key = page index or "all"
  pageCount?: number; // only for brochures created in the Studio
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
    title: d.title,
  };
}
