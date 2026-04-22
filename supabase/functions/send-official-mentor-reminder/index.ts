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

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Admin check
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    // Two modes: { invitationId } targeted, or { all: true } bulk-pending
    const targetIds: string[] = [];

    if (body.invitationId) {
      targetIds.push(body.invitationId);
    } else if (body.all === true) {
      const { data: pending } = await supabaseClient
        .from('official_mentor_invitations')
        .select('id')
        .eq('status', 'pending');
      (pending || []).forEach((p: any) => targetIds.push(p.id));
    } else {
      return new Response(JSON.stringify({ error: 'invitationId or all=true required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of targetIds) {
      const { data: inv, error: invErr } = await supabaseClient
        .from('official_mentor_invitations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (invErr || !inv) { failed++; continue; }
      if (inv.status === 'accepted') { skipped++; continue; }

      // Rate limit: skip if reminder sent within last 48h
      if (inv.last_reminder_sent_at) {
        const last = new Date(inv.last_reminder_sent_at).getTime();
        if (Date.now() - last < 48 * 60 * 60 * 1000) {
          skipped++;
          continue;
        }
      }

      const inviteUrl = `https://startupfactoryhub.com/official-mentor-invite?token=${inv.invitation_token}&startTour=1`;
      const reminderNumber = (inv.reminder_count || 0) + 1;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Startup Factory Hub <info@startupfactoryhub.com>',
          to: [inv.email],
          subject: '⏰ Reminder: Finish setting up your Official Mentor profile',
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
              <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:36px 32px;text-align:center;border-radius:8px 8px 0 0;">
                <div style="display:inline-block;width:56px;height:56px;background:#d4a937;border-radius:50%;line-height:56px;font-size:28px;margin-bottom:14px;">⏰</div>
                <h1 style="color:#ffffff;font-size:24px;margin:0;letter-spacing:-0.5px;">A friendly reminder</h1>
                <p style="color:#d4a937;margin-top:6px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Official Mentor Program</p>
              </div>

              <div style="padding:34px 32px;">
                <p style="color:#333;font-size:16px;line-height:1.7;margin:0 0 20px;">
                  Hi there 👋 — we noticed you haven't finished setting up your <strong>Official Mentor &amp; Advisor</strong> profile yet.
                </p>
                <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
                  It only takes a couple of minutes, and once you're done you'll unlock all the perks: HSBC intro, 25% referral commission, venture-fund startup intros, and your verified Official badge.
                </p>

                <div style="background:#faf8f3;border:1px solid #e8e2d0;border-left:4px solid #d4a937;padding:20px 24px;margin:20px 0;border-radius:0 8px 8px 0;">
                  <p style="margin:0 0 12px;font-weight:700;color:#1a1a1a;font-size:15px;">✨ What's new since your invitation:</p>
                  <p style="margin:0;color:#333;font-size:14px;line-height:1.6;">
                    We've built an <strong>interactive guided tour</strong> that walks you through the platform in 60 seconds. When you click below, the tour will start automatically and show you exactly where to go.
                  </p>
                </div>

                <div style="text-align:center;margin:32px 0;">
                  <a href="${inviteUrl}" target="_blank" style="display:inline-block;background:#d4a937;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(212,169,55,0.3);">
                    Continue Setup & Start Tour
                  </a>
                </div>

                <div style="background:#f5f5f5;border-radius:8px;padding:22px;margin:24px 0;">
                  <p style="margin:0 0 14px;font-weight:700;color:#1a1a1a;font-size:14px;">📋 Just 3 quick steps:</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:8px 10px;vertical-align:top;width:32px;">
                        <div style="width:24px;height:24px;background:#d4a937;border-radius:50%;color:#fff;text-align:center;line-height:24px;font-weight:700;font-size:12px;">1</div>
                      </td>
                      <td style="padding:8px 0;color:#333;font-size:13px;line-height:1.5;">Complete your profile (name, bio, photo, LinkedIn)</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 10px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#d4a937;border-radius:50%;color:#fff;text-align:center;line-height:24px;font-weight:700;font-size:12px;">2</div>
                      </td>
                      <td style="padding:8px 0;color:#333;font-size:13px;line-height:1.5;">Verify your email address</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 10px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#d4a937;border-radius:50%;color:#fff;text-align:center;line-height:24px;font-weight:700;font-size:12px;">3</div>
                      </td>
                      <td style="padding:8px 0;color:#333;font-size:13px;line-height:1.5;">Connect with one member to activate your badge</td>
                    </tr>
                  </table>
                </div>

                <p style="color:#999;font-size:12px;line-height:1.6;margin:20px 0 0;">
                  Button not working? Copy this link:<br>
                  <a href="${inviteUrl}" style="color:#d4a937;word-break:break-all;">${inviteUrl}</a>
                </p>
              </div>

              <div style="background:#f9f9f9;padding:22px 32px;text-align:center;border-top:1px solid #eee;border-radius:0 0 8px 8px;">
                <p style="color:#999;font-size:12px;margin:0 0 6px;">
                  Reminder #${reminderNumber} · Your invitation is still valid.
                </p>
                <p style="margin:0;">
                  <a href="https://startupfactoryhub.com" style="color:#d4a937;text-decoration:none;font-size:12px;font-weight:600;">startupfactoryhub.com</a>
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error('Resend error:', errBody);
        errors.push(`${inv.email}: ${errBody.slice(0, 120)}`);
        failed++;
        continue;
      }

      // Update reminder bookkeeping
      await supabaseClient
        .from('official_mentor_invitations')
        .update({
          last_reminder_sent_at: new Date().toISOString(),
          reminder_count: reminderNumber,
        })
        .eq('id', inv.id);

      sent++;
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, failed, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
