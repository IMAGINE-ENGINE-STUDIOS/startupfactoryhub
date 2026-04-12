import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NVIDIA_LINK = "https://www.nvidia.com/en-us/startups/?ncid=em-even-511353-vt53&nvweb_e=&mkt_tok=MTU2LU9GTi03NDIAAAGgyaJn1WUfrxhH43ovtwTdC_rG321mnwq0cbQ9CEJ2XbvZXRLL7KusQ_vPt6DC3_BRV-qBgU024vMbOIIYOEpDJ8jUnKLz4Kt-8IQbcR38AGjpuP-ZCGHosA";
const SFH_AUTH_LINK = "https://startupfactoryhub.com/auth";
const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/startup-factory-hub-logo.png";
const nvidiaImageUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/NVIDIA.jpeg";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const { to, recipientName, companyName } = await req.json();
    if (!to) throw new Error('Recipient email (to) is required');

    const greeting = recipientName ? `Dear ${recipientName},` : 'Hello,';
    const companyLine = companyName ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${companyName}</span></div>` : '';

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
    .container { background: #0f1419; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(14,162,112,0.3); }
    .header { background: #0ea270; padding: 40px 32px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: 16px; overflow: hidden; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 6px; }
    .hero { background: linear-gradient(180deg, #1a1f35 0%, #0f1419 100%); padding: 32px; text-align: center; }
    .nvidia-badge { width: 160px; height: auto; margin: 0 auto 20px; border-radius: 12px; display: block; }
    .badge { display: inline-block; background: rgba(118,185,0,0.15); border: 1px solid rgba(118,185,0,0.3); color: #76b900; padding: 8px 20px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .hero h2 { color: #fff; font-size: 26px; font-weight: 700; margin-bottom: 8px; }
    .hero p { color: #9ca3af; font-size: 15px; line-height: 1.6; }
    .content { padding: 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 24px; }
    .card-title { color: #0ea270; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #9ca3af; font-size: 14px; }
    .detail-value { color: #f3f4f6; font-size: 14px; font-weight: 600; }
    .greeting { color: #e5e7eb; font-size: 16px; line-height: 1.7; margin-bottom: 24px; }
    .benefits { list-style: none; padding: 0; margin: 0 0 24px; }
    .benefits li { color: #e5e7eb; font-size: 14px; padding: 8px 0 8px 28px; position: relative; line-height: 1.5; }
    .benefits li::before { content: "✓"; position: absolute; left: 0; color: #76b900; font-weight: 700; font-size: 16px; }
    .steps { margin-bottom: 24px; }
    .step { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
    .step-num { width: 32px; height: 32px; background: #0ea270; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .step-text h4 { color: #f3f4f6; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .step-text p { color: #9ca3af; font-size: 13px; }
    .cta-section { text-align: center; margin: 32px 0 16px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #76b900, #5a8f00); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 8px 24px rgba(118,185,0,0.4); margin-bottom: 12px; }
    .cta-secondary { display: inline-block; background: linear-gradient(135deg, #0ea270, #059669); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 6px 20px rgba(14,162,112,0.4); }
    .or-divider { color: #6b7280; font-size: 13px; margin: 16px 0; }
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
          <img src="${logoUrl}" alt="SFH Logo" />
        </div>
        <h1>Startup Factory Hub</h1>
        <p>AI-Powered Startup Accelerator Platform</p>
      </div>

      <div class="hero">
        <img src="${nvidiaImageUrl}" alt="NVIDIA Inception Program" class="nvidia-badge" />
        <div class="badge">Always Open</div>
        <h2>You're Invited to NVIDIA Inception</h2>
        <p>Join the world's premier program for cutting-edge startups through our direct partnership link.</p>
      </div>

      <div class="content">
        <p class="greeting">${greeting}</p>

        ${companyLine ? `
        <div class="card">
          <div class="card-title">Your Details</div>
          ${companyLine}
          <div class="detail-row"><span class="detail-label">Invited To</span><span class="detail-value">${to}</span></div>
        </div>
        ` : ''}

        <div class="card">
          <div class="card-title">Program Benefits</div>
          <ul class="benefits">
            <li>GPU credits and cloud computing resources</li>
            <li>Technical support from NVIDIA engineers</li>
            <li>Investor connections and fundraising support</li>
            <li>Access to NVIDIA expertise and deep learning tools</li>
            <li>Co-marketing and brand exposure opportunities</li>
            <li>Exclusive training on AI, data science &amp; HPC</li>
          </ul>
        </div>

        <div class="card">
          <div class="card-title">How to Apply</div>
          <div class="steps">
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">
                <h4>Apply via NVIDIA</h4>
                <p>Click the button below to apply through our direct link</p>
              </div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">
                <h4>Sign in to Startup Factory Hub</h4>
                <p>Track your application and access accelerator resources</p>
              </div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">
                <h4>Access resources &amp; support</h4>
                <p>Get mentorship, networking, and tools to accelerate your startup</p>
              </div>
            </div>
          </div>
        </div>

        <div class="cta-section">
          <a href="${NVIDIA_LINK}" class="cta-btn">Apply to NVIDIA Inception →</a>
          <p class="or-divider">— then —</p>
          <a href="${SFH_AUTH_LINK}" class="cta-secondary">Sign In to Startup Factory Hub</a>
        </div>
      </div>

      <div class="footer">
        <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.7;" />
        <p>This email was sent to <strong>${to}</strong> via Startup Factory Hub.</p>
        <p style="margin-top:8px">&copy; 2025 Startup Factory Hub &middot; <a href="https://startupfactoryhub.com">startupfactoryhub.com</a></p>
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
        to: [to],
        subject: 'Join NVIDIA Inception Program — Apply Through Startup Factory Hub',
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    console.log('NVIDIA Inception invite sent to:', to);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error sending NVIDIA Inception invite:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
