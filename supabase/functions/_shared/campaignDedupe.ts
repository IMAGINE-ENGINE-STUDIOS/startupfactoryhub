// Shared duplicate-prevention helpers for the auto-posting campaigns.
// Both the MVP Program and the Accelerator-as-a-Service functions compare a
// candidate post against recent history from BOTH campaigns, so the two tracks
// never publish near-identical copy.

export interface DedupeConfig {
  lookbackPosts: number
  windowDays: number
  threshold: number
}

export const DEFAULT_DEDUPE: DedupeConfig = {
  lookbackPosts: 12,
  windowDays: 45,
  threshold: 0.62,
}

export function readDedupeConfig(settings: Record<string, unknown> | null): DedupeConfig {
  return {
    lookbackPosts: Number(settings?.dedupe_lookback_posts ?? DEFAULT_DEDUPE.lookbackPosts) || DEFAULT_DEDUPE.lookbackPosts,
    windowDays: Number(settings?.dedupe_window_days ?? DEFAULT_DEDUPE.windowDays) || DEFAULT_DEDUPE.windowDays,
    threshold: Number(settings?.similarity_threshold ?? DEFAULT_DEDUPE.threshold) || DEFAULT_DEDUPE.threshold,
  }
}

export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/#[\p{L}\p{N}_]+/gu, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Jaccard-style overlap of significant words, ignoring links and hashtags. */
export function similarity(a: string, b: string): number {
  const toSet = (s: string) => new Set(normalizeText(s).split(' ').filter((w) => w.length > 3))
  const A = toSet(a)
  const B = toSet(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  A.forEach((w) => {
    if (B.has(w)) inter++
  })
  return inter / Math.min(A.size, B.size)
}

export function firstLine(s: string): string {
  return normalizeText((s || '').split('\n')[0])
}

export interface HistoryEntry {
  post_text: string | null
  angle?: string | null
  created_at?: string | null
  campaign: 'mvp' | 'partners'
}

/**
 * Recent posts from both campaign tables, limited to the configured time
 * window and to the last N items per campaign.
 */
export async function fetchRecentHistory(
  admin: any,
  cfg: DedupeConfig,
): Promise<HistoryEntry[]> {
  const since = new Date(Date.now() - cfg.windowDays * 86400000).toISOString()

  const [partners, mvp] = await Promise.all([
    admin
      .from('partners_campaign_posts')
      .select('post_text, angle, created_at')
      .in('status', ['published', 'approved', 'draft'])
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(cfg.lookbackPosts),
    admin
      .from('mvp_campaign_posts')
      .select('post_text, angle, created_at')
      .in('status', ['posted', 'partial'])
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(cfg.lookbackPosts),
  ])

  const rows: HistoryEntry[] = [
    ...((partners.data || []) as any[]).map((r) => ({ ...r, campaign: 'partners' as const })),
    ...((mvp.data || []) as any[]).map((r) => ({ ...r, campaign: 'mvp' as const })),
  ].filter((r) => !!r.post_text)

  return rows.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
}

export interface DuplicateCheck {
  duplicate: boolean
  score: number
  reason?: string
  matchedCampaign?: 'mvp' | 'partners'
}

/** True when the candidate is too close to anything in the recent window. */
export function checkDuplicate(
  candidate: string,
  history: HistoryEntry[],
  cfg: DedupeConfig,
): DuplicateCheck {
  let worst: DuplicateCheck = { duplicate: false, score: 0 }

  for (const entry of history) {
    const previous = entry.post_text || ''
    if (!previous) continue

    const score = similarity(previous, candidate)
    const sameOpening = firstLine(previous) && firstLine(previous) === firstLine(candidate)

    if (score > worst.score) {
      worst = { duplicate: false, score, matchedCampaign: entry.campaign }
    }

    if (score >= cfg.threshold || sameOpening) {
      return {
        duplicate: true,
        score: Math.max(score, worst.score),
        matchedCampaign: entry.campaign,
        reason: sameOpening
          ? `Identical opening line to a ${entry.campaign} post within the last ${cfg.windowDays} days`
          : `${Math.round(score * 100)}% similar to a ${entry.campaign} post within the last ${cfg.windowDays} days`,
      }
    }
  }

  return worst
}
