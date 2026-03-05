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

    const inviteUrl = `https://startupfactoryhub.com/official-mentor-invite?token=${token}`;
    const personalMessage = message ? `<p style="margin:20px 0;color:#555;font-style:italic;border-left:3px solid #d4a937;padding-left:14px;">"${message}"</p>` : '';

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
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:40px 32px;text-align:center;border-radius:8px 8px 0 0;">
              <div style="display:inline-block;width:56px;height:56px;background:#d4a937;border-radius:50%;line-height:56px;font-size:28px;margin-bottom:16px;">⭐</div>
              <h1 style="color:#ffffff;font-size:26px;margin:0;letter-spacing:-0.5px;">Official Mentor Program</h1>
              <p style="color:#d4a937;margin-top:6px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Exclusive Invitation</p>
            </div>

            <!-- Body -->
            <div style="padding:36px 32px;">
              <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 20px;">
                You've been <strong>personally selected</strong> to join our <strong>Official Mentor &amp; Advisor Program</strong> — 
                an exclusive, invite-only designation reserved for top mentors and advisors on Startup Factory Hub.
              </p>

              ${personalMessage}

              <!-- Benefits -->
              <div style="background:#faf8f3;border:1px solid #e8e2d0;border-left:4px solid #d4a937;padding:20px 24px;margin:24px 0;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 12px;font-weight:700;color:#1a1a1a;font-size:15px;">🏆 As an Official Member, you'll receive:</p>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;line-height:1.6;">✅ Access to <strong>all platform perks</strong></td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;line-height:1.6;">✅ Free bank account — <strong>HSBC introduction</strong></td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;line-height:1.6;">✅ <strong>25% referral commission</strong> (instead of standard 20%)</td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;line-height:1.6;">✅ Direct startup introductions via our <strong>venture fund</strong></td></tr>
                  <tr><td style="padding:6px 0;color:#333;font-size:14px;line-height:1.6;">✅ <strong>Official verified badge</strong> on your profile &amp; posts</td></tr>
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${inviteUrl}" target="_blank" style="display:inline-block;background:#d4a937;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(212,169,55,0.3);">
                  Accept Invitation
                </a>
              </div>

              <!-- How It Works -->
              <div style="background:#f5f5f5;border-radius:8px;padding:24px;margin:28px 0;">
                <p style="margin:0 0 16px;font-weight:700;color:#1a1a1a;font-size:15px;">📋 How to earn your Official badge:</p>
                <p style="color:#555;font-size:13px;line-height:1.5;margin:0 0 16px;">Once you accept the invitation, you'll see a checklist on your dashboard. Complete these 3 simple steps to unlock your Official status:</p>
                
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 12px;vertical-align:top;width:36px;">
                      <div style="width:28px;height:28px;background:#d4a937;border-radius:50%;color:#fff;text-align:center;line-height:28px;font-weight:700;font-size:13px;">1</div>
                    </td>
                    <td style="padding:10px 0;">
                      <p style="margin:0;font-weight:600;color:#1a1a1a;font-size:14px;">Complete Your Profile</p>
                      <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Fill in your full name, bio, profile photo, and LinkedIn URL. A complete profile helps startups find and trust you.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;vertical-align:top;">
                      <div style="width:28px;height:28px;background:#d4a937;border-radius:50%;color:#fff;text-align:center;line-height:28px;font-weight:700;font-size:13px;">2</div>
                    </td>
                    <td style="padding:10px 0;">
                      <p style="margin:0;font-weight:600;color:#1a1a1a;font-size:14px;">Verify Your Email</p>
                      <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Make sure your email address is confirmed. If you're already logged in, this step may already be done!</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;vertical-align:top;">
                      <div style="width:28px;height:28px;background:#d4a937;border-radius:50%;color:#fff;text-align:center;line-height:28px;font-weight:700;font-size:13px;">3</div>
                    </td>
                    <td style="padding:10px 0;">
                      <p style="margin:0;font-weight:600;color:#1a1a1a;font-size:14px;">Make a Connection</p>
                      <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.5;">Connect with at least one member on the platform. Networking is at the heart of the Startup Factory Hub community.</p>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:16px;padding:12px 16px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;">
                  <p style="margin:0;color:#333;font-size:13px;line-height:1.5;">
                    💡 <strong>Tip:</strong> Once all 3 steps are complete, click <strong>"Check Status"</strong> on your dashboard checklist. Your Official badge will be activated instantly — visible on your profile and all your posts.
                  </p>
                </div>
              </div>

              <!-- Fallback link -->
              <p style="color:#999;font-size:12px;line-height:1.6;margin:20px 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color:#d4a937;word-break:break-all;">${inviteUrl}</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f9f9f9;padding:24px 32px;text-align:center;border-top:1px solid #eee;border-radius:0 0 8px 8px;">
              <p style="color:#999;font-size:12px;margin:0 0 8px;">
                This invitation expires in 30 days. If you didn't expect this email, you can safely ignore it.
              </p>
              <p style="margin:0;">
                <a href="https://startupfactoryhub.com" style="color:#d4a937;text-decoration:none;font-size:12px;font-weight:600;">startupfactoryhub.com</a>
                &nbsp;·&nbsp;
                <a href="https://www.linkedin.com/company/startup-factory-hub" style="color:#999;text-decoration:none;font-size:12px;">LinkedIn</a>
              </p>
            </div>
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
