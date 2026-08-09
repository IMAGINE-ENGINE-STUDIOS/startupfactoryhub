import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const ANGLES = [
  'the real cost and timeline of building an accelerator program in-house',
  'AI-matched mentors and investors as core platform capability',
  'founder analytics and portfolio tracking for program managers',
  'a direct question to a corporate innovation leader evaluating options',
  'market intelligence: seeing deal flow and sector signals before others do',
  'a short narrative about an institution that wanted an accelerator and had no team to run it',
  'weeks to deploy versus years to stand up',
  'why the traditional accelerator model is infrastructure-heavy',
  'measuring program ROI with real portfolio data',
  'running a program across multiple geographies without local offices',
  'what a partner actually receives on day one of the platform',
  'the operating team you do not have to hire',
  'from mandate to first batch: a compressed timeline',
  'turning an innovation budget into a structured venture pipeline',
]

const HASHTAG_POOL = [
  '#corporateinnovation',
  '#startupaccelerator',
  '#venturecapital',
  '#innovation',
  '#acceleratorasaservice',
]

// America/New_York is UTC-4 (EDT) or UTC-5 (EST). Convert a local hour to UTC.
function etOffsetHours(d: Date): number {
  const month = d.getUTCMonth()
  return month >= 2 && month <= 10 ? 4 : 5
}

function nextSlots(
  days: number[] = [1, 3],
  hourLocal = 9,
  from = new Date(),
  count = 4,
): Date[] {
  const allowed = days.length ? days : [1, 3]
  const slots: Date[] = []
  const d = new Date(from)
  for (let i = 0; i < 60 && slots.length < count; i++) {
    if (allowed.includes(d.getUTCDay())) {
      const utcHour = hourLocal + etOffsetHours(d)
      const candidate = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), utcHour, 0, 0),
      )
      if (candidate.getTime() > from.getTime()) slots.push(candidate)
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return slots
}


async function generateCopy(opts: {
  apiKey: string
  angle: string
  landingUrl: string
  hashtags: string[]
  previous: string[]
}): Promise<string> {
  const prompt = `Write a LinkedIn post for "Startup Factory Hub", an AI-powered Accelerator-as-a-Service platform.

Audience: decision-makers at corporates, investment firms and institutions who want to run a startup accelerator program without building the infrastructure themselves. NOT individual founders.

Platform facts you may draw from:
- AI-matched mentors and investors
- Founder analytics and portfolio tracking
- Market intelligence and deal-flow signals
- Deployable in weeks, no large internal team required
- Contrast only with "the traditional accelerator model" in general terms (slow to build, infrastructure-heavy, years to stand up). Never name or disparage any specific competitor.

Angle for THIS post: ${opts.angle}

Rules:
- Under 150 words. LinkedIn-native formatting: short lines, frequent line breaks, no walls of text.
- Executive, high-level, confident tone. No hype clichés, no emojis, no markdown, no bold syntax.
- End with the link on its own line: ${opts.landingUrl}
- Final line: exactly these hashtags: ${opts.hashtags.join(' ')}
- The opening line and the overall structure must be clearly different from every previous post below.

Previous posts:
${opts.previous.map((p, i) => `--- previous ${i + 1} ---\n${p.slice(0, 600)}`).join('\n') || '(none yet)'}

Return only the post text.`

  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': opts.apiKey,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({ model: 'openai/gpt-5.6-sol', input: prompt, stream: true }),
  })

  if (!res.ok || !res.body) {
    const body = await res.text()
    throw new Error(`AI request failed [${res.status}]: ${body}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let text = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''
    for (const chunk of chunks) {
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const evt = JSON.parse(payload)
          if (evt.type === 'response.output_text.delta' && typeof evt.delta === 'string') {
            text += evt.delta
          } else if (evt.type === 'response.completed' && !text) {
            text = evt.response?.output_text ?? ''
          }
        } catch {
          // ignore partial frames
        }
      }
    }
  }

  const cleaned = text.trim()
  if (!cleaned) throw new Error('AI returned empty post text')
  return cleaned
}

function similarity(a: string, b: string): number {
  const norm = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3),
    )
  const A = norm(a)
  const B = norm(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  A.forEach((w) => {
    if (B.has(w)) inter++
  })
  return inter / Math.min(A.size, B.size)
}

function firstLine(s: string) {
  return (s || '').trim().split('\n')[0].trim().toLowerCase()
}

function extractHashtags(text: string): string[] {
  return [...new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []))]
}

const TRACKING_CAMPAIGN = 'partners_auto'

function makeTrackingCode() {
  return `pa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function buildTrackedUrl(landingUrl: string, code: string) {
  const url = new URL(landingUrl)
  url.searchParams.set('utm_source', 'linkedin')
  url.searchParams.set('utm_medium', 'social')
  url.searchParams.set('utm_campaign', TRACKING_CAMPAIGN)
  url.searchParams.set('utm_content', code)
  return url.toString()
}

async function buildPost(admin: any, apiKey: string, landingUrl: string) {
  const { data: history } = await admin
    .from('partners_campaign_posts')
    .select('post_text, angle')
    .in('status', ['published', 'approved'])
    .order('created_at', { ascending: false })
    .limit(10)

  const previous = (history || []).map((h: any) => h.post_text || '').filter(Boolean)
  const usedAngles = new Set((history || []).map((h: any) => h.angle).filter(Boolean))
  const angle =
    ANGLES.find((a) => !usedAngles.has(a)) || ANGLES[Math.floor(Math.random() * ANGLES.length)]

  // rotate a 3-4 hashtag subset
  const offset = (history?.length || 0) % HASHTAG_POOL.length
  const rotated = [...HASHTAG_POOL.slice(offset), ...HASHTAG_POOL.slice(0, offset)]
  const hashtags = rotated.slice(0, 3 + ((history?.length || 0) % 2))

  // Every generated item carries its own UTM-tagged link for attribution
  const trackingCode = makeTrackingCode()
  const trackingUrl = buildTrackedUrl(landingUrl, trackingCode)

  let text = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    text = await generateCopy({ apiKey, angle, landingUrl: trackingUrl, hashtags, previous })
    const tooSimilar = previous.some(
      (p) => similarity(p, text) > 0.62 || (p && firstLine(p) === firstLine(text)),
    )
    if (!tooSimilar) break
  }

  // Guarantee the tracked link is present even if the model dropped or altered it
  if (!text.includes(trackingCode)) {
    text = `${text.replace(new RegExp(`${landingUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\S*`, 'g'), '').trim()}\n\n${trackingUrl}`
  }

  return { text, angle, trackingCode, trackingUrl }
}


async function publishToLinkedIn(admin: any, text: string) {
  const { data: orgToken } = await admin
    .from('linkedin_org_tokens')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!orgToken?.access_token || !orgToken?.org_urn) {
    throw new Error('No LinkedIn Company Page credentials configured')
  }

  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${orgToken.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: orgToken.org_urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`LinkedIn post failed [${resp.status}]: ${body}`)
  }
  const result = await resp.json()
  return String(result.id ?? '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const body = await req.json().catch(() => ({}))
    const action: string = body?.action ?? 'run'

    // Admin-only actions require a signed-in admin
    if (action !== 'run') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: claims } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''))
      const userId = claims?.claims?.sub
      if (!userId) return json({ error: 'Unauthorized' }, 401)
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' })
      if (!isAdmin) return json({ error: 'Admin only' }, 403)
    }

    const { data: settings } = await admin
      .from('partners_campaign_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!settings) throw new Error('Partners campaign settings not configured')

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

    // ---- Save LinkedIn credentials from the settings screen ----
    if (action === 'set-credentials') {
      const accessToken = String(body?.access_token ?? '').trim()
      const orgUrn = String(body?.org_urn ?? '').trim()
      const orgName = String(body?.org_name ?? 'Startup Factory Hub').trim()
      if (!accessToken || !/^urn:li:organization:\d+$/.test(orgUrn)) {
        return json({ error: 'A valid access token and urn:li:organization:<id> are required' }, 400)
      }
      await admin.from('linkedin_org_tokens').update({ is_active: false }).eq('is_active', true)
      const { error } = await admin.from('linkedin_org_tokens').insert({
        access_token: accessToken,
        org_urn: orgUrn,
        org_name: orgName,
        is_active: true,
        expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
      })
      if (error) throw error
      return json({ success: true })
    }

    if (action === 'credentials-status') {
      const { data } = await admin
        .from('linkedin_org_tokens')
        .select('org_urn, org_name, expires_at, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return json({
        connected: !!data,
        org: data,
        slots: nextSlots(settings.post_days ?? [1, 3], settings.post_hour_local ?? 9).map((d) =>
          d.toISOString(),
        ),
      })
    }

    // ---- Preview the exact copy that will publish next (no writes) ----
    if (action === 'preview') {
      const nextSlot =
        nextSlots(settings.post_days ?? [1, 3], settings.post_hour_local ?? 9)[0]?.toISOString() ??
        null

      const { data: queued } = await admin
        .from('partners_campaign_posts')
        .select('*')
        .in('status', ['draft', 'approved'])
        .order('scheduled_for', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      if (queued?.post_text) {
        return json({
          source: 'queued',
          post_id: queued.id,
          post_text: queued.post_text,
          angle: queued.angle,
          hashtags: extractHashtags(queued.post_text),
          scheduled_for: queued.scheduled_for ?? nextSlot,
          landing_url: settings.landing_url,
          auto_publish: settings.auto_publish_unreviewed ?? false,
          is_enabled: settings.is_enabled,
        })
      }

      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')
      const { text, angle } = await buildPost(admin, LOVABLE_API_KEY, settings.landing_url)
      return json({
        source: 'generated',
        post_id: null,
        post_text: text,
        angle,
        hashtags: extractHashtags(text),
        scheduled_for: nextSlot,
        landing_url: settings.landing_url,
        auto_publish: settings.auto_publish_unreviewed ?? false,
        is_enabled: settings.is_enabled,
      })
    }

    // ---- Generate a draft for a given slot (queue filler / regenerate) ----

    if (action === 'generate' || action === 'regenerate') {
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')
      const { text, angle } = await buildPost(admin, LOVABLE_API_KEY, settings.landing_url)

      if (action === 'regenerate' && body?.id) {
        const { data, error } = await admin
          .from('partners_campaign_posts')
          .update({ post_text: text, angle, status: 'draft', generated_at: new Date().toISOString() })
          .eq('id', body.id)
          .select('*')
          .single()
        if (error) throw error
        return json({ success: true, post: data })
      }

      const scheduledFor =
        body?.scheduled_for ??
        nextSlots(settings.post_days ?? [1, 3], settings.post_hour_local ?? 9)[0].toISOString()
      const { data, error } = await admin
        .from('partners_campaign_posts')
        .insert({ post_text: text, angle, status: 'draft', scheduled_for: scheduledFor })
        .select('*')
        .single()
      if (error) throw error
      return json({ success: true, post: data })
    }

    // ---- Publish a specific queued post immediately ----
    if (action === 'publish-now') {
      const { data: post } = await admin
        .from('partners_campaign_posts')
        .select('*')
        .eq('id', body?.id)
        .maybeSingle()
      if (!post?.post_text) return json({ error: 'Post not found' }, 404)
      try {
        const linkedinId = await publishToLinkedIn(admin, post.post_text)
        await admin
          .from('partners_campaign_posts')
          .update({
            status: 'published',
            posted_at: new Date().toISOString(),
            linkedin_post_id: linkedinId,
            error_message: null,
          })
          .eq('id', post.id)
        await admin
          .from('partners_campaign_settings')
          .update({ last_posted_at: new Date().toISOString() })
          .eq('id', settings.id)
        return json({ success: true, linkedin_post_id: linkedinId })
      } catch (e) {
        const message = (e as Error).message
        await admin
          .from('partners_campaign_posts')
          .update({ status: 'failed', error_message: message })
          .eq('id', post.id)
        return json({ error: message }, 500)
      }
    }

    // ---- Scheduled run (pg_cron runs hourly; settings decide the days/hour) ----
    if (!settings.is_enabled) return json({ skipped: 'campaign_disabled' })

    const now = new Date()
    if (body?.force !== true) {
      const days: number[] = settings.post_days?.length ? settings.post_days : [1, 3]
      const hourLocal: number = settings.post_hour_local ?? 9
      const localHour = (now.getUTCHours() - etOffsetHours(now) + 24) % 24
      const localDay =
        now.getUTCHours() - etOffsetHours(now) < 0
          ? (now.getUTCDay() + 6) % 7
          : now.getUTCDay()
      if (!days.includes(localDay) || localHour !== hourLocal) {
        return json({ skipped: 'not_scheduled_slot', local_day: localDay, local_hour: localHour })
      }
    }
    const { data: queued } = await admin
      .from('partners_campaign_posts')
      .select('*')
      .in('status', ['approved', 'draft'])
      .lte('scheduled_for', new Date(now.getTime() + 6 * 3600000).toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .maybeSingle()

    let target = queued
    if (target && target.status === 'draft' && !settings.auto_publish_unreviewed) {
      return json({ skipped: 'awaiting_approval', post_id: target.id })
    }

    if (!target) {
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')
      const { text, angle } = await buildPost(admin, LOVABLE_API_KEY, settings.landing_url)
      const { data: created, error } = await admin
        .from('partners_campaign_posts')
        .insert({
          post_text: text,
          angle,
          status: 'approved',
          scheduled_for: now.toISOString(),
        })
        .select('*')
        .single()
      if (error) throw error
      target = created
    }

    try {
      const linkedinId = await publishToLinkedIn(admin, target.post_text)
      await admin
        .from('partners_campaign_posts')
        .update({
          status: 'published',
          posted_at: new Date().toISOString(),
          linkedin_post_id: linkedinId,
          error_message: null,
        })
        .eq('id', target.id)
      await admin
        .from('partners_campaign_settings')
        .update({ last_posted_at: new Date().toISOString() })
        .eq('id', settings.id)

      // Pre-generate the draft for the next slot so it can be reviewed a day ahead
      if (LOVABLE_API_KEY) {
        try {
          const next = nextSlots(settings.post_days ?? [1, 3], settings.post_hour_local ?? 9)[0]
          const { data: exists } = await admin
            .from('partners_campaign_posts')
            .select('id')
            .in('status', ['draft', 'approved'])
            .gte('scheduled_for', new Date().toISOString())
            .limit(1)
            .maybeSingle()
          if (!exists) {
            const { text, angle } = await buildPost(admin, LOVABLE_API_KEY, settings.landing_url)
            await admin.from('partners_campaign_posts').insert({
              post_text: text,
              angle,
              status: 'draft',
              scheduled_for: next.toISOString(),
            })
          }
        } catch (e) {
          console.error('pre-generation failed:', (e as Error).message)
        }
      }

      return json({ success: true, linkedin_post_id: linkedinId, post_id: target.id })
    } catch (e) {
      const message = (e as Error).message
      console.error(message)
      await admin
        .from('partners_campaign_posts')
        .update({ status: 'failed', error_message: message })
        .eq('id', target.id)
      return json({ error: message }, 500)
    }
  } catch (error) {
    console.error('post-partners-campaign error:', (error as Error).message)
    return json({ error: (error as Error).message }, 500)
  }
})
