// Two-way LinkedIn <-> Startup Factory Hub event synchronization.
// Outbound: publishes upcoming public platform events to the LinkedIn Company Page.
// Inbound:  imports events owned by the Company Page back into public.events.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveLinkedInAuthor } from '../_shared/linkedinAuthor.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SITE_URL = 'https://startupfactoryhub.com'

function buildTrackedUrl(eventId: string) {
  const url = new URL(`${SITE_URL}/events`)
  url.searchParams.set('event', eventId)
  url.searchParams.set('utm_source', 'linkedin')
  url.searchParams.set('utm_medium', 'social')
  url.searchParams.set('utm_campaign', 'events_auto')
  url.searchParams.set('utm_content', `ev-${eventId.slice(0, 8)}`)
  return url.toString()
}

function formatWhen(startISO: string) {
  const d = new Date(startISO)
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
}

function buildEventPost(ev: any, link: string) {
  const where = ev.is_virtual
    ? 'Online'
    : [ev.location, ev.city, ev.country].filter(Boolean).join(', ') || 'To be announced'

  const description = (ev.description || '').replace(/\s+/g, ' ').trim().slice(0, 320)

  return [
    ev.title,
    '',
    description,
    '',
    `When: ${formatWhen(ev.start_date)}`,
    `Where: ${where}`,
    '',
    'Register:',
    link,
    '',
    '#startupfactoryhub #startups #innovation #events',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
}

async function publishToLinkedIn(admin: any, text: string) {
  const author = await resolveLinkedInAuthor(admin)
  if (!author) {
    throw new Error(
      'No LinkedIn Company Page connected. Authorize the page in Marketing > Auto-Posting before events can sync.',
    )
  }

  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${author.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: author.org_urn,
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

// ---------- Outbound: platform events -> LinkedIn ----------
async function runOutbound(admin: any, settings: any) {
  if (!settings.outbound_enabled) return { skipped: 'outbound disabled' }

  const { data: lastPost } = await admin
    .from('event_linkedin_sync')
    .select('posted_at')
    .eq('direction', 'outbound')
    .eq('status', 'posted')
    .order('posted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastPost?.posted_at) {
    const hours = (Date.now() - new Date(lastPost.posted_at).getTime()) / 3_600_000
    if (hours < (settings.min_hours_between_posts ?? 24)) {
      return { skipped: `throttled, ${hours.toFixed(1)}h since last event post` }
    }
  }

  const { data: alreadyPosted } = await admin
    .from('event_linkedin_sync')
    .select('event_id')
    .eq('direction', 'outbound')
    .in('status', ['posted', 'pending'])

  const excluded = new Set((alreadyPosted || []).map((r: any) => r.event_id).filter(Boolean))

  const { data: events } = await admin
    .from('events')
    .select('*')
    .eq('is_public', true)
    .gt('start_date', new Date().toISOString())
    .is('external_source', null)
    .order('start_date', { ascending: true })
    .limit(20)

  const target = (events || []).find((e: any) => !excluded.has(e.id))
  if (!target) return { skipped: 'no unposted upcoming public events' }

  const text = buildEventPost(target, buildTrackedUrl(target.id))

  try {
    const postId = await publishToLinkedIn(admin, text)
    await admin.from('event_linkedin_sync').insert({
      event_id: target.id,
      direction: 'outbound',
      linkedin_post_id: postId,
      post_text: text,
      status: 'posted',
      posted_at: new Date().toISOString(),
    })
    return { posted: true, event: target.title, linkedin_post_id: postId }
  } catch (e) {
    const message = (e as Error).message
    await admin.from('event_linkedin_sync').insert({
      event_id: target.id,
      direction: 'outbound',
      post_text: text,
      status: 'failed',
      error_message: message,
    })
    return { posted: false, event: target.title, error: message }
  }
}

// ---------- Inbound: LinkedIn events -> platform ----------
async function runInbound(admin: any, settings: any) {
  if (!settings.inbound_enabled) return { skipped: 'inbound disabled' }

  const author = await resolveLinkedInAuthor(admin)
  if (!author) return { error: 'No LinkedIn Company Page connected' }
  if (author.kind !== 'organization') {
    return { skipped: 'inbound import requires a Company Page token' }
  }

  const url =
    `https://api.linkedin.com/rest/events?q=organizer&organizer=${encodeURIComponent(author.org_urn)}&count=25`

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${author.access_token}`,
      'LinkedIn-Version': '202405',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  })

  if (!resp.ok) {
    const body = await resp.text()
    // LinkedIn only exposes the Events API to approved partners; report it plainly.
    return { imported: 0, error: `LinkedIn events read failed [${resp.status}]: ${body.slice(0, 400)}` }
  }

  const payload = await resp.json()
  const elements: any[] = payload?.elements ?? []
  let imported = 0
  const errors: string[] = []

  // events.organizer_id is NOT NULL — use an admin account as the system organizer.
  const { data: adminRole } = await admin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()
  const systemOrganizerId = adminRole?.user_id
  if (!systemOrganizerId) {
    return { imported: 0, error: 'No admin user found to use as system organizer' }
  }

  for (const el of elements) {
    const urn = String(el.id ?? el.entityUrn ?? '')
    if (!urn) continue
    const start = el?.timeRange?.start ?? el?.startAt
    if (!start) continue

    const startIso = new Date(Number(start)).toISOString()
    // end_date is NOT NULL — default to start + 2h when LinkedIn omits it.
    const endIso = el?.timeRange?.end
      ? new Date(Number(el.timeRange.end)).toISOString()
      : new Date(Number(start) + 2 * 60 * 60 * 1000).toISOString()

    const row = {
      title: el?.name?.localized?.en_US ?? el?.name ?? 'LinkedIn Event',
      description: el?.description?.localized?.en_US ?? el?.description ?? null,
      start_date: startIso,
      end_date: endIso,
      is_virtual: el?.mode === 'ONLINE' || el?.eventMode === 'ONLINE',
      is_public: true,
      organizer_id: systemOrganizerId,
      external_source: 'linkedin',
      external_id: urn,
      external_url: `https://www.linkedin.com/events/${urn.split(':').pop()}`,
    }

    const { data: existing } = await admin
      .from('events')
      .select('id')
      .eq('external_source', 'linkedin')
      .eq('external_id', urn)
      .maybeSingle()

    if (existing) {
      const { error: updateError } = await admin.from('events').update(row).eq('id', existing.id)
      if (updateError) errors.push(`${urn}: ${updateError.message}`)
    } else {
      const { data: inserted, error: insertError } = await admin
        .from('events')
        .insert(row)
        .select('id')
        .maybeSingle()
      if (insertError || !inserted) {
        const message = insertError?.message ?? 'insert returned no row'
        errors.push(`${urn}: ${message}`)
        await admin.from('event_linkedin_sync').insert({
          direction: 'inbound',
          linkedin_event_urn: urn,
          status: 'failed',
          error_message: message,
        })
        continue
      }
      await admin.from('event_linkedin_sync').insert({
        event_id: inserted.id,
        direction: 'inbound',
        linkedin_event_urn: urn,
        status: 'imported',
        posted_at: new Date().toISOString(),
      })
      imported++
    }
  }

  return {
    imported,
    seen: elements.length,
    ...(errors.length ? { error: `Failed to import ${errors.length} event(s): ${errors.slice(0, 3).join(' | ')}` } : {}),
  }
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
      .from('event_sync_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!settings) return json({ error: 'Event sync settings not configured' }, 500)

    if (action === 'status') {
      const author = await resolveLinkedInAuthor(admin)
      const { data: history } = await admin
        .from('event_linkedin_sync')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      return json({ settings, connected: !!author, author_kind: author?.kind ?? null, history })
    }

    if (action === 'toggle') {
      const patch: Record<string, boolean> = {}
      if (typeof body?.enabled === 'boolean') patch.enabled = body.enabled
      if (typeof body?.outbound_enabled === 'boolean') patch.outbound_enabled = body.outbound_enabled
      if (typeof body?.inbound_enabled === 'boolean') patch.inbound_enabled = body.inbound_enabled
      await admin.from('event_sync_settings').update(patch).eq('id', settings.id)
      return json({ ok: true, ...patch })
    }

    // action === 'run' (cron) or 'sync-now' (admin)
    if (!settings.enabled && action === 'run') return json({ skipped: 'campaign disabled' })

    const outbound = await runOutbound(admin, settings)
    const inbound = await runInbound(admin, settings)

    return json({ ok: true, outbound, inbound })
  } catch (e) {
    console.error('sync-events-linkedin error', e)
    return json({ error: (e as Error).message }, 500)
  }
})
