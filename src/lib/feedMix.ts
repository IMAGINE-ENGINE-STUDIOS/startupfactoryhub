/**
 * Feed Mix — the mosaic wall ranking + layout for the Social feed.
 *
 * Ranking (founder-approved 2026-10-30):
 * - Freshness gates: regular posts only from the last 21 days; reels
 *   (shorts) from the last 90 days (evergreen video, and few); event
 *   posts are governed by the EVENT date, not the post date — shown
 *   only while the event is upcoming within the next 30 days and never
 *   after it ends, so future series appear as their month arrives.
 * - Score = (1 + likes + 3 * comments) * 0.5^(ageDays / 4), with boosts:
 *   live rooms x1.6, events starting within 72h x1.4, announcements and
 *   reels x1.2. Weighted shuffle (Efraimidis–Spirakis) so every visit is
 *   a different mix; posts seen this session are demoted to x0.25;
 *   never two posts by the same author back to back, never three of the
 *   same type in a row.
 *
 * Layout — a dense mosaic wall (auto-flow dense, 104px row unit):
 * every tile's span follows its format, media fills its tile edge to
 * edge, and nothing is ever more than 2 rows tall:
 * - events and videos: 2x2 feature tiles (banner/video full-bleed)
 * - reels: 1x2 tall tiles — ALWAYS this exact size
 * - photos, announcements, cohorts, journeys: 2x1 wide tiles
 * - live rooms (no picture): 1x1 small tiles
 * - text posts sized by length: 2x2 / 2x1 / 1x2 / 1x1
 * Investor firms and accelerator cohorts join the wall as partner
 * tiles (2x1), spliced through the stream.
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

/* ── Wall layout ───────────────────────────────────────────────────── */

export type WallSpan = '22' | '21' | '12' | '11';

export const SPAN_CLASS: Record<WallSpan, string> = {
  '22': 'col-span-2 row-span-2',
  '21': 'col-span-2 row-span-1',
  '12': 'col-span-1 row-span-2',
  '11': 'col-span-1 row-span-1',
};

/** The span a post's format earns. Reels are always '12', no exceptions. */
export function spanForPost(post: FeedMixPost): WallSpan {
  if (post.post_type === 'short') return '12';
  if (post.post_type === 'event') return '22';
  if (postVideoUrl(post)) return '22';
  if (postImageUrl(post)) return '21';
  if (post.post_type === 'live_room') return '11';
  if (['announcement', 'cohort', 'journey_completion'].includes(post.post_type)) return '21';
  const len = post.content?.length || 0;
  if (len > 280) return '22';
  if (len > 140) return '21';
  if (len > 60) return '12';
  return '11';
}

export interface WallPartner {
  kind: 'firm' | 'cohort';
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface WallEntry<T> {
  key: string;
  span: WallSpan;
  post?: T;
  partner?: WallPartner;
}

/**
 * Build the wall: posts in mixed order with partner tiles (investor
 * firms, accelerator cohorts) spliced in every few tiles. The grid's
 * dense auto-flow packs the spans into a tight mosaic.
 */
export function buildWallLayout<T extends FeedMixPost>(ordered: T[], partners: WallPartner[] = []): WallEntry<T>[] {
  const entries: WallEntry<T>[] = ordered.map((post) => ({ key: post.id, span: spanForPost(post), post }));
  if (partners.length) {
    const spliced: WallEntry<T>[] = [];
    let pi = 0;
    entries.forEach((entry, i) => {
      spliced.push(entry);
      if ((i + 1) % 5 === 4 && pi < partners.length) {
        const partner = partners[pi++];
        spliced.push({ key: partner.id, span: '21', partner });
      }
    });
    while (pi < partners.length) {
      const partner = partners[pi++];
      spliced.push({ key: partner.id, span: '21', partner });
    }
    return spliced;
  }
  return entries;
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
