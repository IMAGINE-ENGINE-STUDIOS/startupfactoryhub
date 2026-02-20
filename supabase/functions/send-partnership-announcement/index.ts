import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase credentials not configured');

    const {
      partnerName,
      partnerLogo,
      partnerWebsite,
      partnerDescription,
      benefitsForStartups,
      ctaLabel = 'Learn More',
      ctaUrl = 'https://startupfactoryhub.lovable.app/dashboard',
      targetEmails, // optional: send only to specific emails, otherwise sends to all users
    } = await req.json();

    if (!partnerName || !partnerDescription) {
      throw new Error('partnerName and partnerDescription are required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine recipients
    let recipients: { email: string; full_name: string | null }[] = [];

    if (targetEmails && Array.isArray(targetEmails) && targetEmails.length > 0) {
      recipients = targetEmails.map((email: string) => ({ email, full_name: null }));
    } else {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('email, full_name')
        .not('email', 'is', null);
      recipients = (allUsers || []) as any[];
    }

    const html = (recipientName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 36px 32px; text-align: center; }
    .header img.logo { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 12px; object-fit: contain; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .partnership-banner { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 36px 32px; text-align: center; }
    .partnership-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #0ea270; padding: 6px 20px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
    .logos-row { display: flex; align-items: center; justify-content: center; gap: 20px; margin: 20px 0; }
    .logos-row .sfh-logo { width: 64px; height: 64px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,0.05); padding: 4px; }
    .logos-row .plus { font-size: 28px; color: #0ea270; font-weight: 700; }
    .logos-row .partner-logo { width: 64px; height: 64px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,0.05); padding: 4px; }
    .partner-placeholder { width: 64px; height: 64px; border-radius: 12px; background: rgba(14,162,112,0.2); border: 2px solid rgba(14,162,112,0.4); display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .partnership-banner h2 { color: #f3f4f6; font-size: 24px; font-weight: 800; margin: 16px 0 8px; }
    .partnership-banner p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .card-label { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
    .benefits-list { list-style: none; }
    .benefits-list li { color: #d1d5db; font-size: 14px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: flex-start; gap: 10px; }
    .benefits-list li:last-child { border-bottom: none; }
    .benefits-list li::before { content: '✅'; flex-shrink: 0; }
    .cta-section { text-align: center; padding: 12px 0 8px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,162,112,0.4); }
    .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img class="logo" src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Platform Announcement</p>
      </div>

      <div class="partnership-banner">
        <div class="partnership-badge">🤝 New Partnership</div>
        <div class="logos-row">
          <img class="sfh-logo" src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
          <span class="plus">×</span>
          ${partnerLogo
            ? `<img class="partner-logo" src="${partnerLogo}" alt="${partnerName}" />`
            : `<div class="partner-placeholder">🏢</div>`}
        </div>
        <h2>SFH × ${partnerName}</h2>
        <p>We're excited to announce a new partnership that brings more value to our community!</p>
      </div>

      <div class="content">
        <div class="card">
          <div class="card-label">🏢 About ${partnerName}</div>
          <p>${partnerDescription}</p>
          ${partnerWebsite ? `<p style="margin-top:12px"><a href="${partnerWebsite}" style="color:#0ea270;text-decoration:none;font-weight:600;">🌐 Visit their website →</a></p>` : ''}
        </div>

        ${benefitsForStartups && benefitsForStartups.length > 0 ? `
        <div class="card">
          <div class="card-label">🎁 Benefits for You, ${recipientName}</div>
          <ul class="benefits-list">
            ${(Array.isArray(benefitsForStartups) ? benefitsForStartups : [benefitsForStartups])
              .map((b: string) => `<li>${b}</li>`).join('')}
          </ul>
        </div>` : ''}

        <div class="cta-section">
          <a href="${ctaUrl}" class="cta-btn">🚀 ${ctaLabel}</a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this as a valued member of Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.lovable.app">Startup Factory Hub</a> · All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    let sent = 0;
    let errors = 0;

    for (const user of recipients) {
      if (!user.email) continue;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Startup Factory Hub <onboarding@resend.dev>',
            to: [user.email],
            subject: `🤝 New Partnership: SFH × ${partnerName}`,
            html: html(user.full_name || 'Member'),
          }),
        });

        if (res.ok) sent++;
        else {
          errors++;
          console.error(`Failed for ${user.email}:`, await res.text());
        }

        await new Promise(r => setTimeout(r, 80));
      } catch (err) {
        errors++;
        console.error(`Error for ${user.email}:`, err);
      }
    }

    console.log(`Partnership announcement sent: ${sent} success, ${errors} errors`);

    return new Response(JSON.stringify({ success: true, sent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Partnership announcement error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
