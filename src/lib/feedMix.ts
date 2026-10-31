/**
 * Feed Mix — the square-net mosaic ranking for the Social feed.
 *
 * Rules (founder-approved 2026-10-30, revised same day):
 * - Freshness gates: regular posts only from the last 21 days; reels
 *   (shorts) from the last 90 days (they are evergreen video and few);
 *   event posts are governed by the EVENT date, not the post date —
 *   shown only while the event is upcoming within the next 30 days and
 *   never after it ends, so future series appear as their month arrives.
 * - Score = (1 + likes + 3 * comments) * 0.5^(ageDays / 4), with boosts:
 *   live rooms x1.6, events starting within 72h x1.4, announcements and
 *   reels x1.2.
 * - Weighted shuffle (Efraimidis–Spirakis) so every visit is a different
 *   mix with strong posts tending to land early.
 * - Posts already seen this session are demoted to x0.25 weight.
 * - Interleave: never two posts by the same author back to back, never
 *   three of the same type in a row.
 * - Layout is a format-true net: big squares (2x2) for events/features,
 *   tall tiles (1x2) for reels, wide tiles (2x1) for landscape media and
 *   long text, small squares (1x1) for short posts — poured into a
 *   repeating 11-slot block that tiles exactly. Media keeps its own
 *   format inside the tile (16:9 areas, no stretched banners).
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
export const REEL_WINDOW_DAYS = 90;
export const EVENT_WINDOW_DAYS = 30;
const DAY_MS = 86400000;
const SEEN_KEY = 'sfh:feed:seen:v1';

export function postAgeDays(post: FeedMixPost, nowMs: number): number {
  return (nowMs - new Date(post.created_at).getTime()) / DAY_MS;
}

export function isEligible(post: FeedMixPost, nowMs: number): boolean {
  if (post.post_type === 'event') {
    const start = post.event_data?.start_date;
    if (start) {
      const end = post.event_data?.end_date || start;
      if (new Date(end).getTime() < nowMs) return false; // already over
      if (new Date(start).getTime() > nowMs + EVENT_WINDOW_DAYS * DAY_MS) return false; // too far out
      return true; // the event date is the freshness for event posts
    }
    // Unlinked event post: fall back to the regular post-age gate.
    return postAgeDays(post, nowMs) <= FEED_WINDOW_DAYS;
  }
  if (post.post_type === 'short') return postAgeDays(post, nowMs) <= REEL_WINDOW_DAYS;
  return postAgeDays(post, nowMs) <= FEED_WINDOW_DAYS;
}

function rawEngagement(post: FeedMixPost): number {
  return 1 + (post._count?.post_likes || 0) + 3 * (post._count?.post_comments || 0);
}

export function feedScore(post: FeedMixPost, nowMs: number, seen: ReadonlySet<string>): number {
  let s = rawEngagement(post) * Math.pow(0.5, postAgeDays(post, nowMs) / 4);
  if (post.post_type === 'live_room') s *= 1.6;
  if (post.post_type === 'announcement') s *= 1.2;
  if (post.post_type === 'short') s *= 1.2;
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

export type TileKind = 'B' | 'T' | 'W' | 'S';

/**
 * The tile format a post wants:
 * B = big square (events, live rooms, cohorts, journeys, announcements, videos)
 * T = tall (reels/shorts — portrait video)
 * W = wide (landscape photo posts, long text)
 * S = small square (short text)
 */
export function tileKind(post: FeedMixPost): TileKind {
  if (post.post_type === 'short') return 'T';
  if (['event', 'live_room', 'cohort', 'journey_completion', 'announcement'].includes(post.post_type)) return 'B';
  if (postVideoUrl(post)) return 'B';
  if (postImageUrl(post)) return 'W';
  return (post.content?.length || 0) > 140 ? 'W' : 'S';
}

/* ── Format-true net layout ────────────────────────────────────────── */

export interface NetTile<T> {
  post: T;
  className: string;
  /** The slot's format: B big square, T tall, W wide, S small square. */
  slot: TileKind;
}
export interface NetBlock<T> {
  tiles: NetTile<T>[];
  dense: boolean;
}
export interface NetLayout<T> {
  blocks: NetBlock<T>[];
}

interface SlotDef {
  kind: TileKind;
  cls: string;
  fallbacks: TileKind[];
}
/** Repeating block on a 6-col × 4-row net of square cells (11 tiles). */
const SLOTS: SlotDef[] = [
  { kind: 'B', cls: 'sm:[grid-column:1/span_2] sm:[grid-row:1/span_2]', fallbacks: ['B', 'T', 'W', 'S'] },
  { kind: 'T', cls: 'sm:[grid-column:3/span_1] sm:[grid-row:1/span_2]', fallbacks: ['T', 'B', 'W', 'S'] },
  { kind: 'B', cls: 'sm:[grid-column:4/span_2] sm:[grid-row:1/span_2]', fallbacks: ['B', 'T', 'W', 'S'] },
  { kind: 'S', cls: 'sm:[grid-column:6/span_1] sm:[grid-row:1/span_1]', fallbacks: ['S', 'W', 'T', 'B'] },
  { kind: 'S', cls: 'sm:[grid-column:6/span_1] sm:[grid-row:2/span_1]', fallbacks: ['S', 'W', 'T', 'B'] },
  { kind: 'W', cls: 'sm:[grid-column:1/span_2] sm:[grid-row:3/span_1]', fallbacks: ['W', 'B', 'S', 'T'] },
  { kind: 'T', cls: 'sm:[grid-column:3/span_1] sm:[grid-row:3/span_2]', fallbacks: ['T', 'B', 'W', 'S'] },
  { kind: 'B', cls: 'sm:[grid-column:4/span_2] sm:[grid-row:3/span_2]', fallbacks: ['B', 'T', 'W', 'S'] },
  { kind: 'S', cls: 'sm:[grid-column:6/span_1] sm:[grid-row:3/span_1]', fallbacks: ['S', 'W', 'T', 'B'] },
  { kind: 'W', cls: 'sm:[grid-column:1/span_2] sm:[grid-row:4/span_1]', fallbacks: ['W', 'B', 'S', 'T'] },
  { kind: 'S', cls: 'sm:[grid-column:6/span_1] sm:[grid-row:4/span_1]', fallbacks: ['S', 'W', 'T', 'B'] },
];
const BASE_CLASS: Record<TileKind, string> = {
  B: 'col-span-2 row-span-2 aspect-square sm:aspect-auto',
  T: 'row-span-2 aspect-[1/2] sm:aspect-auto',
  W: 'col-span-2 aspect-[2/1] sm:aspect-auto',
  S: 'aspect-square sm:aspect-auto',
};

/**
 * Pour the mixed order into repeating 11-slot net blocks. The final
 * partial block (when the pool runs out) becomes a dense segment whose
 * tiles pack by span, so the net never shows a named hole.
 */
export function buildNetLayout<T extends FeedMixPost>(ordered: T[]): NetLayout<T> {
  const pool = [...ordered];
  const blocks: NetBlock<T>[] = [];
  while (pool.length >= SLOTS.length) {
    const tiles: NetTile<T>[] = [];
    for (const slot of SLOTS) {
      let idx = -1;
      for (const kind of slot.fallbacks) {
        idx = pool.findIndex((p) => tileKind(p) === kind);
        if (idx >= 0) break;
      }
      if (idx < 0) idx = 0;
      const [post] = pool.splice(idx, 1);
      tiles.push({ post, className: `${BASE_CLASS[slot.kind]} ${slot.cls}`, slot: slot.kind });
    }
    blocks.push({ tiles, dense: false });
  }
  if (pool.length) {
    blocks.push({
      tiles: pool.map((post) => ({ post, className: BASE_CLASS[tileKind(post)], slot: tileKind(post) })),
      dense: true,
    });
  }
  return { blocks };
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
