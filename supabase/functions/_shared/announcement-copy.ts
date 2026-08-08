// Shared, well-structured copy builder for the automated startup announcements.
// Used by the LinkedIn Company Page auto-post and by the RSS feed so every
// channel publishes the exact same structured announcement.

const ACRONYMS = new Set(['mvp', 'ai', 'saas', 'iot', 'b2b', 'b2c', 'vr', 'ar', 'ev', 'fintech'])

export function pretty(v: unknown, fallback: string): string {
  const s = String(v ?? '').trim()
  if (!s || s.toLowerCase() === 'other') return fallback
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/[^\s]+/g, (w) =>
      ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1),
    )
}

export function renderTemplate(tpl: string, c: Record<string, unknown>): string {
  return String(tpl ?? '')
    .replace(/\{startup_name\}/g, String(c.name ?? ''))
    .replace(/\{industry\}/g, pretty(c.industry, 'innovation'))
    .replace(/\{stage\}/g, pretty(c.stage, 'Early-Stage'))
    .replace(/\{founder\}/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export interface AnnouncementCompany {
  id?: string
  name?: string | null
  description?: string | null
  industry?: string | null
  stage?: string | null
  website?: string | null
}

const SITE = 'https://startupfactoryhub.com'

function cleanUrl(url?: string | null): string | null {
  const u = String(url ?? '').trim()
  if (!u) return null
  return u.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function hashtag(v: unknown): string | null {
  const s = String(v ?? '').trim()
  if (!s || s.toLowerCase() === 'other') return null
  const t = s.replace(/[^a-zA-Z0-9]+/g, '')
  return t ? `#${t.charAt(0).toUpperCase()}${t.slice(1)}` : null
}

/**
 * Builds the structured announcement body:
 * headline / one-line intro / what they do / fact list / CTA / hashtags.
 */
export function buildAnnouncementText(
  company: AnnouncementCompany,
  opts: { headline?: string | null; intro?: string | null } = {},
): { headline: string; body: string; full: string } {
  const name = String(company.name ?? 'This startup').trim()
  const stage = pretty(company.stage, 'Early-Stage')
  const industry = pretty(company.industry, 'Innovation')

  const headline = (opts.headline || `Welcome ${name} to Startup Factory Hub`).trim()

  const intro =
    (opts.intro || '').trim() ||
    `${name} just joined our accelerator — a ${stage.toLowerCase()} venture building in ${industry.toLowerCase()}.`

  const about = String(company.description ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)

  const site = cleanUrl(company.website)
  const profile = company.id ? `${SITE}/dashboard?tab=network&company=${company.id}` : SITE

  const facts = [
    `Stage: ${stage}`,
    `Industry: ${industry}`,
    site ? `Website: ${site}` : null,
  ].filter(Boolean) as string[]

  const tags = ['#StartupFactoryHub', '#Startups', hashtag(company.industry), '#Innovation']
    .filter(Boolean)
    .join(' ')

  const blocks = [
    headline,
    intro,
    about ? `What they do\n${about}` : null,
    facts.join('\n'),
    `Startup Factory Hub backs founders with MVP development, mentorship, investor access and a global operator network.`,
    `See their profile → ${profile}`,
    tags,
  ].filter(Boolean) as string[]

  const full = blocks.join('\n\n')
  return { headline, body: blocks.slice(1).join('\n\n'), full }
}
