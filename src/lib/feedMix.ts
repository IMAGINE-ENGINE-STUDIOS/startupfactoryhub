/**
 * Feed Mix — the square-net mosaic ranking for the Social feed.
 *
 * Rules (founder-approved 2026-10-30):
 * - Only posts from the last 21 days are eligible, and event posts drop
 *   out once their event has ended. Old posts never resurface.
 * - Score = (1 + likes + 3 * comments) * 0.5^(ageDays / 4), with boosts:
 *   live rooms x1.6, events starting within 72h x1.4, announcements x1.2.
 * - Weighted shuffle (Efraimidis–Spirakis) so every visit is a different
 *   mix with strong posts tending to land early.
 * - Posts already seen this session are demoted to x0.25 weight.
 * - Interleave: never two posts by the same author back to back, never
 *   three of the same type in a row.
 * - The top-2 posts by raw engagement become Spotlight bands.
 * - Layout is a square net: big tiles are 2x2 squares, small tiles 1x1,
 *   poured into a repeating 9-slot block that tiles exactly.
 */

export interface FeedMixPost {
  id: string;
  user_id: string;
  post_type: string;
  created_at: string;
  content?: string | null;
  media_urls?: string[] | null;
  event_data?: { start_date?: string; end_date?: string } | null;
  _count?: { post_likes?: number; post_comments?: number };
}

export const FEED_WINDOW_DAYS = 21;
const DAY_MS = 86400000;
const SEEN_KEY = 'sfh:feed:seen:v1';

export function postAgeDays(post: FeedMixPost, nowMs: number): number {
  return (nowMs - new Date(post.created_at).getTime()) / DAY_MS;
}

export function isEligible(post: FeedMixPost, nowMs: number): boolean {
  if (postAgeDays(post, nowMs) > FEED_WINDOW_DAYS) return false;
  if (post.post_type === 'event' && post.event_data) {
    const end = post.event_data.end_date || post.event_data.start_date;
    if (end && new Date(end).getTime() < nowMs) return false;
  }
  return true;
}

function rawEngagement(post: FeedMixPost): number {
  return 1 + (post._count?.post_likes || 0) + 3 * (post._count?.post_comments || 0);
}

export function feedScore(post: FeedMixPost, nowMs: number, seen: ReadonlySet<string>): number {
  let s = rawEngagement(post) * Math.pow(0.5, postAgeDays(post, nowMs) / 4);
  if (post.post_type === 'live_room') s *= 1.6;
  if (post.post_type === 'announcement') s *= 1.2;
  if (post.post_type === 'event' && post.event_data?.start_date) {
    const startsIn = new Date(post.event_data.start_date).getTime() - nowMs;
    if (startsIn > 0 && startsIn <= 72 * 3600000) s *= 1.4;
  }
  if (seen.has(post.id)) s *= 0.25;
  return Math.max(s, 0.001);
}

/** Weighted shuffle + interleave. Returns a new array; input untouched. */
export function mixFeed<T extends FeedMixPost>(posts: T[], seen: ReadonlySet<string>, nowMs: number = Date.now()): T[] {
  const eligible = posts.filter((p) => isEligible(p, nowMs));
  const keyed = eligible
    .map((p) => ({ p, k: Math.pow(Math.random(), 1 / feedScore(p, nowMs, seen)) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.p);
  const out: T[] = [];
  const pool = [...keyed];
  while (pool.length) {
    let idx = pool.findIndex(
      (p) =>
        (out.length === 0 || out[out.length - 1].user_id !== p.user_id) &&
        !(out.length >= 2 && out[out.length - 1].post_type === p.post_type && out[out.length - 2].post_type === p.post_type),
    );
    if (idx < 0) idx = 0;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/** Top posts by raw engagement, pulled out of the tile stream as Spotlight bands. */
export function pickSpotlights<T extends FeedMixPost>(posts: T[], count = 2): T[] {
  return [...posts].sort((a, b) => rawEngagement(b) - rawEngagement(a)).slice(0, count);
}

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
const hasExt = (url: string, exts: string[]) => {
  const clean = url.toLowerCase().split('?')[0];
  return exts.some((e) => clean.endsWith(e));
};
export const postVideoUrl = (post: FeedMixPost): string | undefined =>
  (post.media_urls || []).filter(Boolean).find((u) => hasExt(u, VIDEO_EXT));
export const postImageUrl = (post: FeedMixPost): string | undefined =>
  (post.media_urls || []).filter(Boolean).find((u) => hasExt(u, IMAGE_EXT));

export type TileKind = 'B' | 'S';

/** Big square (2x2): rich or media posts. Small square (1x1): short text posts. */
export function tileKind(post: FeedMixPost): TileKind {
  if (['event', 'live_room', 'cohort', 'journey_completion', 'announcement'].includes(post.post_type)) return 'B';
  if (postVideoUrl(post) || postImageUrl(post)) return 'B';
  return (post.content?.length || 0) > 140 ? 'B' : 'S';
}

/* ── Square-net layout ─────────────────────────────────────────────── */

export interface NetTile<T> {
  post: T;
  className: string;
  /** True when the tile occupies a 1x1 slot (compact rendering). */
  small: boolean;
}
export interface NetBlock<T> {
  tiles: NetTile<T>[];
  dense: boolean;
}
export interface NetLayout<T> {
  blocks: NetBlock<T>[];
  /** Spotlight band to render after the block at this index. */
  spotAfter: Map<number, T>;
  /** Spotlights that did not fit after a block (pool smaller than one block). */
  leadSpotlights: T[];
}

/** Slot placements for the 6-col net (Tailwind arbitrary grid placement, sm+). */
const SLOT_CLASS: Record<string, string> = {
  sq1: 'sm:[grid-column:1/span_2] sm:[grid-row:1/span_2]',
  sq2: 'sm:[grid-column:3/span_2] sm:[grid-row:1/span_2]',
  sq3: 'sm:[grid-column:5/span_2] sm:[grid-row:1/span_2]',
  sq4: 'sm:[grid-column:1/span_1] sm:[grid-row:3/span_1]',
  sq5: 'sm:[grid-column:2/span_1] sm:[grid-row:3/span_1]',
  sq6: 'sm:[grid-column:3/span_2] sm:[grid-row:3/span_2]',
  sq7: 'sm:[grid-column:1/span_1] sm:[grid-row:4/span_1]',
  sq8: 'sm:[grid-column:2/span_1] sm:[grid-row:4/span_1]',
  sq9: 'sm:[grid-column:5/span_2] sm:[grid-row:3/span_2]',
};
const SLOT_KINDS: TileKind[] = ['B', 'B', 'B', 'S', 'S', 'B', 'S', 'S', 'B'];
const SLOT_NAMES = ['sq1', 'sq2', 'sq3', 'sq4', 'sq5', 'sq6', 'sq7', 'sq8', 'sq9'];
const BASE_CLASS: Record<TileKind, string> = {
  B: 'col-span-2 row-span-2 aspect-square sm:aspect-auto',
  S: 'aspect-square sm:aspect-auto',
};

/**
 * Pour the mixed order into repeating 9-slot square-net blocks. The final
 * partial block (when the pool runs out) becomes a dense segment whose
 * tiles pack by span, so the net never shows a named hole.
 */
export function buildNetLayout<T extends FeedMixPost>(ordered: T[], spotlightIds: ReadonlySet<string>): NetLayout<T> {
  const spots = ordered.filter((p) => spotlightIds.has(p.id));
  const pool = ordered.filter((p) => !spotlightIds.has(p.id));
  const blocks: NetBlock<T>[] = [];
  const spotAfter = new Map<number, T>();

  while (pool.length >= SLOT_KINDS.length) {
    const tiles: NetTile<T>[] = [];
    for (let i = 0; i < SLOT_KINDS.length; i++) {
      let idx = pool.findIndex((p) => tileKind(p) === SLOT_KINDS[i]);
      if (idx < 0) idx = 0;
      const [post] = pool.splice(idx, 1);
      tiles.push({
        post,
        className: `${BASE_CLASS[tileKind(post)]} ${SLOT_CLASS[SLOT_NAMES[i]]}`,
        small: SLOT_KINDS[i] === 'S',
      });
    }
    blocks.push({ tiles, dense: false });
    if (spots.length) spotAfter.set(blocks.length - 1, spots.shift()!);
  }
  if (pool.length) {
    blocks.push({
      tiles: pool.map((post) => ({
        post,
        className: BASE_CLASS[tileKind(post)],
        small: tileKind(post) === 'S',
      })),
      dense: true,
    });
    if (spots.length) spotAfter.set(blocks.length - 1, spots.shift()!);
  }
  // Any leftover spotlights (pool smaller than one block) lead the feed.
  return { blocks, spotAfter, leadSpotlights: spots };
}

/* ── Seen-this-session tracking ────────────────────────────────────── */

export function loadSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function rememberSeenIds(ids: Iterable<string>): void {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(ids)].slice(-500)));
  } catch {
    /* sessionStorage unavailable — demotion just won't persist */
  }
}
