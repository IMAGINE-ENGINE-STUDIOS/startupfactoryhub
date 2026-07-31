import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderAnnouncementBanner } from '../_shared/announcement-banner.ts'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function renderText(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] || '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { company_id, template_id, preview, test_mode } = await req.json()
    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Load company
    const { data: company, error: companyErr } = await admin
      .from('companies').select('*').eq('id', company_id).single()
    if (companyErr || !company) throw new Error(`Company not found: ${companyErr?.message}`)

    if (!preview && !test_mode && company.announcement_posted_at) {
      return new Response(JSON.stringify({ skipped: 'already_announced' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!test_mode && (!company.logo_url || !company.name || !company.description)) {
      return new Response(JSON.stringify({ skipped: 'profile_incomplete' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Load template
    const templateQuery = template_id
      ? admin.from('marketing_templates').select('*').eq('id', template_id).single()
      : admin.from('marketing_templates').select('*').eq('type', 'startup_announcement').eq('is_default', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const { data: template } = await templateQuery
    if (!template) throw new Error('No template configured')

    const vars = {
      startup_name: company.name || '',
      industry: company.industry || 'innovative',
      stage: company.stage || 'early-stage',
      founder: '',
    }
    const headline = test_mode
      ? `[TEST POST — please ignore] ${renderText(template.headline, vars)}`
      : renderText(template.headline, vars)
    const subtext = renderText(template.subtext, vars)


    // Log entry
    const { data: logEntry } = await admin.from('marketing_posts_log').insert({
      company_id, template_id: template.id, status: 'pending',
    }).select().single()

    // Get LinkedIn org token
    const { data: orgToken } = await admin
      .from('linkedin_org_tokens').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()

    if (!orgToken) {
      await admin.from('marketing_posts_log').update({ status: 'failed', error_message: 'No LinkedIn Company Page connected' }).eq('id', logEntry?.id)
      return new Response(JSON.stringify({ error: 'No LinkedIn Company Page connected', headline, subtext }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (preview) {
      return new Response(JSON.stringify({ preview: true, headline, subtext, logo_url: company.logo_url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Render the branded banner and upload it to LinkedIn as a native image
    let mediaAsset: string | null = null
    try {
      const png = await renderAnnouncementBanner({
        name: company.name || 'New Startup',
        industry: company.industry,
        stage: company.stage,
        tagline: company.description,
        logoUrl: company.logo_url,
        primaryColor: template.primary_color,
        accentColor: template.accent_color,
      })

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
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
          },
        }),
      })

      if (!regResp.ok) {
        console.error('registerUpload failed:', regResp.status, await regResp.text())
      } else {
        const reg = await regResp.json()
        const uploadUrl = reg.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${orgToken.access_token}`, 'Content-Type': 'image/png' },
          body: png,
        })
        if (put.ok) mediaAsset = reg.value.asset
        else console.error('banner upload failed:', put.status, await put.text())
      }
    } catch (e) {
      console.error('banner render failed:', (e as Error).message)
    }

    const shareContent: Record<string, unknown> = {
      shareCommentary: { text: `${headline}\n\n${subtext}` },
      shareMediaCategory: mediaAsset ? 'IMAGE' : 'ARTICLE',
      media: mediaAsset
        ? [{ status: 'READY', media: mediaAsset, title: { text: company.name } }]
        : [{
            status: 'READY',
            originalUrl: company.website || 'https://startupfactoryhub.com',
            title: { text: company.name },
            description: { text: company.description?.slice(0, 250) || '' },
            thumbnails: [{ url: company.logo_url }],
          }],
    }

    const postBody = {
      author: orgToken.org_urn,
      lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': shareContent },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }


    const postResp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${orgToken.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    })

    if (!postResp.ok) {
      const errTxt = await postResp.text()
      await admin.from('marketing_posts_log').update({ status: 'failed', error_message: `[${postResp.status}] ${errTxt}` }).eq('id', logEntry?.id)
      return new Response(JSON.stringify({ error: 'LinkedIn post failed', status: postResp.status, details: errTxt }), { status: postResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const result = await postResp.json()

    await admin.from('marketing_posts_log').update({ status: test_mode ? 'test_posted' : 'posted', linkedin_post_id: result.id, posted_at: new Date().toISOString() }).eq('id', logEntry?.id)
    if (!test_mode) {
      await admin.from('companies').update({ announcement_posted_at: new Date().toISOString() }).eq('id', company_id)
    }


    return new Response(JSON.stringify({ success: true, postId: result.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('announce-new-startup error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
