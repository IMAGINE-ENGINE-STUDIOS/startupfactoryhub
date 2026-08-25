import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderMvpBanner } from '../_shared/announcement-banner.ts'
import { resolveLinkedInAuthor } from '../_shared/linkedinAuthor.ts'
import {
  checkDuplicate,
  fetchRecentHistory,
  readDedupeConfig,
} from '../_shared/campaignDedupe.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// SFH feed author for the automated MVP campaign cross-post (ceo@imagineengine.space)
const FEED_AUTHOR_ID = '7f591579-b346-4234-a52b-c8d8e38a6f9f'

const ANGLES = [
  'the cost and time founders waste building the wrong first product',
  'speed: from idea to a working MVP in weeks, not quarters',
  'the mentorship and advisory bench founders get access to',
  'Demo Day and pitching in front of real investors',
  'what founders actually walk away with (MVP, pitch deck, business plan)',
  'why non-technical founders should apply',
  'the deadline pressure and limited number of seats',
  'the difference between a prototype and an investable MVP',
  'building an investor-ready narrative alongside the product',
  'the community of founders inside the batch',
  'common reasons startups stall before their first launch',
  'a short founder-to-founder direct invitation',
  'what happens week by week inside the program',
  'traction: shipping something users can actually try',
  'the final countdown before applications close',
]

function daysBetween(from: Date, to: Date) {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  return Math.round((b - a) / 86400000)
}

async function generateCopy(opts: {
  apiKey: string
  angle: string
  daysLeft: number
  startups: number
  deadlineLabel: string
  applyUrl: string
  previous: string[]
}): Promise<string> {
  const prompt = `Write a LinkedIn post for the Startup Factory Hub "MVP Development Program".

Program facts:
- Founders build a working MVP with an expert product/engineering team.
- Includes mentorship, advisory, pitch deck, business plan and Demo Day (live investor pitch event).
- ${opts.startups} startups per batch.
- The program is 100% online and international: founders from any country can apply (it is NOT limited to Orlando, Florida or the United States).
- Application deadline: ${opts.deadlineLabel}.
- Days remaining to apply: ${opts.daysLeft}.
- Apply link (must appear exactly once, on its own line): ${opts.applyUrl}

Angle for THIS post: ${opts.angle}

Structure the post as:
1. A strong one-line hook (no hashtags in the hook).
2. 2-4 short lines of context on the angle.
3. A compact bullet list (use "→" as the bullet) of what founders get.
4. One urgency line that explicitly mentions "${opts.daysLeft} days left" and the deadline.
5. A clear call to action followed by the apply link on its own line.
6. A final line of 4-6 relevant hashtags.

Rules:
- Plain text only, no markdown headings, no bold syntax, no emojis.
- Maximum 1300 characters.
- Professional, direct, confident tone. No hype clichés like "game-changer" or "unlock".
- Mention at least once that the program is remote and open to founders worldwide. Never mention a single host city.
- It must read clearly differently from these previous posts:
${opts.previous.map((p, i) => `--- previous ${i + 1} ---\n${p.slice(0, 500)}`).join('\n') || '(none yet)'}

Return only the post text.`

  const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': opts.apiKey,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5.6-sol',
      input: prompt,
      stream: true,
    }),
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
          // ignore keep-alive / partial frames
        }
      }
    }
  }

  const cleaned = text.trim()
  if (!cleaned) throw new Error('AI returned empty post text')
  return cleaned
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let logId: string | null = null

  try {
    const body = await req.json().catch(() => ({}))
    const preview: boolean = body?.preview === true
    const force: boolean = body?.force === true

    const { data: settings } = await admin
      .from('mvp_campaign_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!settings) throw new Error('MVP campaign settings not configured')

    if (!settings.is_enabled && !preview && !force) {
      return json({ skipped: 'campaign_disabled' })
    }

    // Schedule gate: cron runs hourly, settings decide the hour + cadence
    if (!preview && !force) {
      const now = new Date()
      const month = now.getUTCMonth()
      const etOffset = month >= 2 && month <= 10 ? 4 : 5
      const localHour = (now.getUTCHours() - etOffset + 24) % 24
      const hourLocal: number = settings.post_hour_local ?? 9
      if (localHour !== hourLocal) {
        return json({ skipped: 'not_scheduled_hour', local_hour: localHour })
      }
      const intervalDays: number = settings.interval_days ?? 2
      if (settings.last_posted_at) {
        const elapsed = (now.getTime() - new Date(settings.last_posted_at).getTime()) / 86400000
        if (elapsed < intervalDays - 0.5) {
          return json({ skipped: 'interval_not_elapsed', days_elapsed: Number(elapsed.toFixed(2)) })
        }
      }
    }

    const deadline = new Date(`${settings.deadline}T23:59:59Z`)
    const daysLeft = daysBetween(new Date(), deadline)

    if (daysLeft < 0 && !preview) {
      await admin.from('mvp_campaign_settings').update({ is_enabled: false }).eq('id', settings.id)
      return json({ skipped: 'deadline_passed' })
    }

    const deadlineLabel = deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })

    // Duplicate prevention: recent posts from BOTH campaigns inside the window
    const dedupeCfg = readDedupeConfig(settings)
    const history = await fetchRecentHistory(admin, dedupeCfg)

    const usedAngles = new Set(
      history.filter((h) => h.campaign === 'mvp').map((h) => h.angle).filter(Boolean),
    )
    const angle =
      ANGLES.find((a) => !usedAngles.has(a)) || ANGLES[Math.floor(Math.random() * ANGLES.length)]

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    // UTM-tagged link so every auto-posted item can be attributed
    const trackingCode = `mvp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    const trackedApplyUrl = (() => {
      const url = new URL(settings.apply_url)
      url.searchParams.set('utm_source', 'linkedin')
      url.searchParams.set('utm_medium', 'social')
      url.searchParams.set('utm_campaign', 'mvp_program_auto')
      url.searchParams.set('utm_content', trackingCode)
      return url.toString()
    })()

    if (!preview) {
      const { data: logEntry } = await admin
        .from('mvp_campaign_posts')
        .insert({
          status: 'pending',
          days_left: daysLeft,
          angle,
          tracking_code: trackingCode,
          tracking_url: trackedApplyUrl,
        })
        .select()
        .single()
      logId = logEntry?.id ?? null
    }

    const previous = history.map((h) => h.post_text || '').filter(Boolean)
    let postText = ''
    let dupe = { duplicate: false, score: 0, reason: undefined as string | undefined }
    for (let attempt = 0; attempt < 4; attempt++) {
      postText = await generateCopy({
        apiKey: LOVABLE_API_KEY,
        angle,
        daysLeft,
        startups: settings.startups_per_batch,
        deadlineLabel,
        applyUrl: trackedApplyUrl,
        previous,
      })
      dupe = checkDuplicate(postText, history, dedupeCfg)
      if (!dupe.duplicate) break
      console.warn(`Duplicate blocked (attempt ${attempt + 1}): ${dupe.reason}`)
    }

    if (dupe.duplicate && !preview) {
      if (logId) {
        await admin
          .from('mvp_campaign_posts')
          .update({
            status: 'blocked_duplicate',
            post_text: postText,
            error_message: dupe.reason,
          })
          .eq('id', logId)
      }
      return json({ skipped: 'duplicate_blocked', reason: dupe.reason })
    }

    if (!postText.includes(trackingCode)) {
      postText = `${postText.trim()}\n\n${trackedApplyUrl}`
    }

    const png = await renderMvpBanner({
      daysLeft,
      startups: settings.startups_per_batch,
      deadlineLabel,
    })

    if (preview) {
      let binary = ''
      for (let i = 0; i < png.length; i += 8192) {
        binary += String.fromCharCode(...png.subarray(i, i + 8192))
      }
      const b64 = btoa(binary)
      return json({
        preview: true,
        angle,
        days_left: daysLeft,
        post_text: postText,
        tracking_url: trackedApplyUrl,
        tracking_code: trackingCode,
        duplicate_blocked: dupe.duplicate,
        duplicate_reason: dupe.reason ?? null,
        similarity_score: Number(dupe.score.toFixed(3)),
        banner_data_url: `data:image/png;base64,${b64}`,
      })
    }


    // ---------- Internal SFH feed cross-post (always runs) ----------
    let feedPostId: string | null = null
    let bannerUrl: string | null = null
    try {
      const path = `mvp-program/${Date.now()}.png`
      const { error: uploadErr } = await admin.storage
        .from('feed-media')
        .upload(path, png, { contentType: 'image/png', upsert: true })
      if (uploadErr) console.error('feed banner upload failed:', uploadErr.message)
      else bannerUrl = admin.storage.from('feed-media').getPublicUrl(path).data.publicUrl

      const { data: feedPost, error: feedErr } = await admin
        .from('feed_posts')
        .insert({
          user_id: FEED_AUTHOR_ID,
          content: postText,
          post_type: 'announcement',
          media_urls: bannerUrl ? [bannerUrl] : null,
        })
        .select('id')
        .single()

      if (feedErr) console.error('feed post failed:', feedErr.message)
      else feedPostId = feedPost?.id ?? null
    } catch (e) {
      console.error('feed cross-post error:', (e as Error).message)
    }

    // ---------- LinkedIn Company Page ----------
    const orgToken = await resolveLinkedInAuthor(admin)

    const postedAt = new Date().toISOString()

    if (!orgToken) {
      const message = 'Startup Factory Hub LinkedIn Company Page publishing is not authorized. A valid organization URN and w_organization_social are required.'
      console.error(message)
      if (feedPostId) {
        await admin.from('feed_posts').delete().eq('id', feedPostId)
        feedPostId = null
      }
      if (logId) {
        await admin
          .from('mvp_campaign_posts')
          .update({
            status: 'failed',
            post_text: postText,
            banner_generated: !!bannerUrl,
            posted_at: null,
            error_message: message,
          })
          .eq('id', logId)
      }
      return json({ success: false, feedPostId: null, linkedin: message, days_left: daysLeft, angle }, 409)
    }

    // Register + upload banner
    let mediaAsset: string | null = null
    const regResp = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${orgToken.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: orgToken.org_urn,
          serviceRelationships: [
            { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
          ],
        },
      }),
    })

    if (!regResp.ok) {
      console.error('registerUpload failed:', regResp.status, await regResp.text())
    } else {
      const reg = await regResp.json()
      const uploadUrl =
        reg.value.uploadMechanism[
          'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ].uploadUrl
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${orgToken.access_token}`,
          'Content-Type': 'image/png',
        },
        body: png,
      })
      if (put.ok) mediaAsset = reg.value.asset
      else console.error('banner upload failed:', put.status, await put.text())
    }

    const shareContent: Record<string, unknown> = {
      shareCommentary: { text: postText },
      shareMediaCategory: mediaAsset ? 'IMAGE' : 'NONE',
      ...(mediaAsset
        ? {
            media: [
              {
                status: 'READY',
                media: mediaAsset,
                title: { text: 'MVP Development Program' },
              },
            ],
          }
        : {}),
    }

    const postResp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${orgToken.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: orgToken.org_urn,
        lifecycleState: 'PUBLISHED',
        specificContent: { 'com.linkedin.ugc.ShareContent': shareContent },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })

    if (!postResp.ok) {
      const errTxt = await postResp.text()
      console.error('LinkedIn post failed:', postResp.status, errTxt)
      if (feedPostId) {
        await admin.from('feed_posts').delete().eq('id', feedPostId)
        feedPostId = null
      }
      if (logId) {
        await admin
          .from('mvp_campaign_posts')
          .update({
            status: 'failed',
            post_text: postText,
            banner_generated: !!bannerUrl,
            posted_at: null,
            error_message: `[${postResp.status}] ${errTxt}`,
          })
          .eq('id', logId)
      }
      return json(
        {
          success: false,
          feedPostId: null,
          error: 'LinkedIn post failed',
          status: postResp.status,
          details: errTxt,
        },
        postResp.status,
      )
    }

    const result = await postResp.json()

    if (logId) {
      await admin
        .from('mvp_campaign_posts')
        .update({
          status: 'posted',
          post_text: postText,
          banner_generated: !!mediaAsset,
          linkedin_post_id: result.id,
          posted_at: postedAt,
        })
        .eq('id', logId)
    }
    await admin
      .from('mvp_campaign_settings')
      .update({ last_posted_at: postedAt })
      .eq('id', settings.id)

    return json({ success: true, postId: result.id, feedPostId, days_left: daysLeft, angle })
  } catch (err) {
    const message = (err as Error).message
    console.error('post-mvp-program error:', message)
    if (logId) {
      await admin
        .from('mvp_campaign_posts')
        .update({ status: 'failed', error_message: message })
        .eq('id', logId)
    }
    return json({ error: message }, 500)
  }
})
