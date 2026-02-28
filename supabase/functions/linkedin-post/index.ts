import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub

    // Get LinkedIn tokens (using service role to bypass RLS for reading)
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: linkedinToken, error: tokenError } = await adminSupabase
      .from('linkedin_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tokenError || !linkedinToken) {
      return new Response(JSON.stringify({ error: 'LinkedIn not connected. Please connect your LinkedIn account first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if token is expired
    if (linkedinToken.expires_at && new Date(linkedinToken.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'LinkedIn token expired. Please reconnect your LinkedIn account.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { text, articleUrl, imageUrl } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: 'Post text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get LinkedIn user sub for author URN
    const linkedinSub = linkedinToken.linkedin_sub
    if (!linkedinSub) {
      return new Response(JSON.stringify({ error: 'LinkedIn user ID not found. Please reconnect.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const authorUrn = `urn:li:person:${linkedinSub}`

    // Build the post body
    let postBody: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    // If there's an article/link to share
    if (articleUrl) {
      postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE'
      postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: articleUrl,
      }]
    }

    // If there's an image, we need to upload it first
    if (imageUrl && !articleUrl) {
      // Register image upload
      const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${linkedinToken.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: authorUrn,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }]
          }
        })
      })

      if (registerResponse.ok) {
        const registerData = await registerResponse.json()
        const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
        const asset = registerData.value.asset

        // Download the image
        const imageResponse = await fetch(imageUrl)
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob()
          
          // Upload to LinkedIn
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${linkedinToken.access_token}`,
            },
            body: imageBlob
          })

          postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE'
          postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [{
            status: 'READY',
            media: asset,
          }]
        }
      }
    }

    // Create the post
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedinToken.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody)
    })

    if (!postResponse.ok) {
      const errorData = await postResponse.text()
      console.error('LinkedIn post failed:', errorData)
      return new Response(JSON.stringify({ error: `Failed to post to LinkedIn: ${postResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const postResult = await postResponse.json()

    return new Response(JSON.stringify({ success: true, postId: postResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('LinkedIn post error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
