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

    const { targetEmails } = await req.json();

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

    const buildHtml = (recipientName: string) => `<!DOCTYPE html>
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
    .hero { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 36px 32px; text-align: center; }
    .hero-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #0ea270; padding: 6px 20px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .hero h2 { color: #f3f4f6; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .hero p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .partners-row { display: flex; align-items: center; justify-content: center; gap: 24px; margin: 28px 0 20px; flex-wrap: wrap; }
    .partner-card { background: rgba(255,255,255,0.06); border-radius: 14px; padding: 16px 24px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
    .partner-card img { height: 40px; max-width: 120px; object-fit: contain; margin-bottom: 8px; }
    .partner-card .name { color: #e5e7eb; font-size: 13px; font-weight: 600; }
    .partner-card .stat { color: #0ea270; font-size: 20px; font-weight: 800; margin-top: 4px; }
    .partner-card .stat-label { color: #9ca3af; font-size: 11px; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .card-label { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
    .benefits-list { list-style: none; }
    .benefits-list li { color: #d1d5db; font-size: 14px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: flex-start; gap: 10px; }
    .benefits-list li:last-child { border-bottom: none; }
    .benefits-list li::before { content: '✅'; flex-shrink: 0; }
    .cta-section { text-align: center; padding: 16px 0 8px; }
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
        <p>Weekly Platform Update</p>
      </div>

      <div class="hero">
        <div class="hero-badge">🏢 New This Week</div>
        <h2>Welcome to Startup Factory Hub!</h2>
        <p>Hi <strong>${recipientName}</strong>, this week we've partnered with <strong>IWG</strong> and <strong>HSBC</strong> to bring you incredible workspace and banking benefits!</p>

        <div class="partners-row">
          <div class="partner-card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/300px-HSBC_logo_%282018%29.svg.png" alt="HSBC" style="height:40px;max-width:120px;object-fit:contain;margin-bottom:8px;" />
            <div class="name">HSBC Innovation Banking</div>
            <div class="stat">USA</div>
            <div class="stat-label">Available Region</div>
          </div>
          <div class="partner-card">
            <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/iwg-logo.svg" alt="IWG" style="height:40px;max-width:120px;object-fit:contain;margin-bottom:8px;" />
            <div class="name">IWG</div>
            <div class="stat">130+</div>
            <div class="stat-label">Countries Worldwide</div>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="card">
          <div class="card-label">🏢 Office Spaces Through IWG</div>
          <p>Through our subscription program, you now have access to <strong>flexible workspaces across 130+ countries worldwide</strong> via IWG (International Workplace Group). Whether you need a hot desk, private office, or meeting room — we've got you covered in cities across the globe.</p>
        </div>

        <div class="card">
          <div class="card-label">🏦 Free Banking with HSBC</div>
          <p>We've partnered with <strong>HSBC Innovation Banking</strong> to offer <strong>free banking accounts</strong> to our startup community! Access world-class banking services designed specifically for startups and scaling businesses, currently available in the <strong>USA</strong>.</p>
        </div>

        <div class="card">
          <div class="card-label">🎁 What You Get, ${recipientName}</div>
          <ul class="benefits-list">
            <li>Access to 5,800+ IWG office spaces worldwide through our subscription</li>
            <li>Free HSBC Innovation Banking account for your startup</li>
            <li>Exclusive member discounts on workspace bookings</li>
            <li>Premium banking services tailored for startups</li>
            <li>Global network of professional workspaces and banking support</li>
          </ul>
        </div>

        <div class="cta-section">
          <a href="https://startupfactoryhub.com/dashboard" class="cta-btn">🚀 Go to Resource Dashboard</a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this as a valued member of Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true">LinkedIn</a> · All rights reserved</p>
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
            from: 'Startup Factory Hub <info@startupfactoryhub.com>',
            to: [user.email],
            subject: `🏢 Welcome to SFH — This Week: IWG & HSBC Partnership!`,
            html: buildHtml(user.full_name || 'Member'),
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

    console.log(`Weekly welcome sent: ${sent} success, ${errors} errors`);

    return new Response(JSON.stringify({ success: true, sent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Weekly welcome error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
