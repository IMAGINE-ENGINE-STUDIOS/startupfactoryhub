import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, message } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate token
    const token = crypto.randomUUID() + '-' + crypto.randomUUID();

    // Insert invitation
    const { error: insertError } = await supabaseClient
      .from('official_mentor_invitations')
      .insert({
        email,
        invited_by: user.id,
        invitation_token: token,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const inviteUrl = `https://startupfactoryhub.lovable.app/official-mentor-invite?token=${token}`;
    const personalMessage = message ? `<p style="margin:16px 0;color:#666;font-style:italic;">"${message}"</p>` : '';

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Startup Factory Hub <info@startupfactoryhub.com>',
        to: [email],
        subject: '🌟 You\'re Invited to the Official Mentor Program — Startup Factory Hub',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:40px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#1a1a1a;font-size:24px;margin:0;">Official Mentor Program</h1>
              <p style="color:#666;margin-top:8px;">Startup Factory Hub</p>
            </div>
            <p style="color:#333;font-size:16px;line-height:1.6;">
              You've been personally selected to join our <strong>Official Mentor/Advisor Program</strong> — 
              an exclusive, invite-only designation for top mentors and advisors on our platform.
            </p>
            ${personalMessage}
            <div style="background:#f8f6f0;border-left:4px solid #d4a937;padding:16px;margin:24px 0;border-radius:4px;">
              <p style="margin:0 0 8px;font-weight:bold;color:#1a1a1a;">As an Official Member, you'll receive:</p>
              <ul style="margin:0;padding-left:20px;color:#333;line-height:1.8;">
                <li>✅ Access to all platform perks</li>
                <li>✅ Free bank account (HSBC introduction)</li>
                <li>✅ 25% referral commission (instead of 20%)</li>
                <li>✅ Direct startup introductions via our venture fund</li>
                <li>✅ Official verified badge on your profile</li>
              </ul>
            </div>
            <div style="text-align:center;margin:32px 0;">
              <a href="${inviteUrl}" style="display:inline-block;background:#d4a937;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                Accept Invitation
              </a>
            </div>
            <p style="color:#999;font-size:12px;text-align:center;">
              This invitation expires in 30 days. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend error:', errBody);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
