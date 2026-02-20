import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const { email, token, applicationId, jobTitle, companyName } = await req.json();
    const origin = req.headers.get('origin') || 'https://startupfactoryhub.lovable.app';
    const invitationUrl = `${origin}/accept-invitation?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg, #0ea270 0%, #059669 100%); padding: 40px 32px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: 16px; overflow: hidden; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 6px; }
    .hero { background: linear-gradient(180deg,#1a1f35 0%,#0f1419 100%); padding: 32px; text-align: center; }
    .badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.3); color: #0ea270; padding: 8px 20px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .hero-icon { font-size: 64px; margin-bottom: 16px; }
    .hero h2 { color: #fff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .hero p { color: #9ca3af; font-size: 15px; line-height: 1.6; }
    .content { padding: 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 24px; }
    .card-title { color: #0ea270; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #9ca3af; font-size: 14px; }
    .detail-value { color: #f3f4f6; font-size: 14px; font-weight: 600; }
    .steps { margin-bottom: 24px; }
    .step { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
    .step-num { width: 32px; height: 32px; background: #0ea270; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .step-text h4 { color: #f3f4f6; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .step-text p { color: #9ca3af; font-size: 13px; }
    .cta-section { text-align: center; margin: 32px 0 24px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 8px 24px rgba(14,162,112,0.4); }
    .expiry { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 8px; padding: 12px 16px; text-align: center; color: #fbbf24; font-size: 13px; margin-top: 24px; }
    .url-fallback { margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; word-break: break-all; font-size: 12px; color: #6b7280; }
    .footer { background: #0a0f1e; padding: 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.15); }
    .footer p { color: #6b7280; font-size: 13px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">
          <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH Logo" />
        </div>
        <h1>Startup Factory Hub</h1>
        <p>AI-Powered Startup Accelerator Platform</p>
      </div>

      <div class="hero">
        <div class="badge">🎉 Application Selected</div>
        <div class="hero-icon">🚀</div>
        <h2>You've Been Chosen!</h2>
        <p>Congratulations — your application stood out. You've been selected to move forward.<br>Create your account to access your tasks and begin your journey.</p>
      </div>

      <div class="content">
        <div class="card">
          <div class="card-title">📋 Application Details</div>
          ${jobTitle ? `<div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>` : ''}
          ${companyName ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${companyName}</span></div>` : ''}
          <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#0ea270">✅ Selected</span></div>
          <div class="detail-row"><span class="detail-label">Invitation Sent To</span><span class="detail-value">${email}</span></div>
        </div>

        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">
              <h4>Click the button below</h4>
              <p>You'll be taken to the platform to create your account</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">
              <h4>Complete your profile</h4>
              <p>Set up your account with your details and skills</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">
              <h4>Start your tasks</h4>
              <p>Access your task list and begin contributing immediately</p>
            </div>
          </div>
        </div>

        <div class="cta-section">
          <a href="${invitationUrl}" class="cta-btn">🚀 Accept Invitation & Get Started</a>
        </div>

        <div class="expiry">
          ⏰ This invitation expires in <strong>48 hours</strong>. Please accept it as soon as possible.
        </div>

        <div class="url-fallback">
          If the button doesn't work, copy and paste this link:<br>${invitationUrl}
        </div>
      </div>

      <div class="footer">
        <p>This invitation was sent to <strong>${email}</strong>.</p>
        <p style="margin-top:8px">© 2025 Startup Factory Hub · <a href="https://startupfactoryhub.lovable.app">startupfactoryhub.lovable.app</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Startup Factory Hub <info@startupfactoryhub.com>',
        to: [email],
        subject: `🎉 You've Been Selected! Accept Your Invitation`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    console.log('Invitation email sent to:', email);

    return new Response(JSON.stringify({ success: true, invitationUrl, emailId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
