import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NVIDIA_LINK = "https://www.nvidia.com/en-us/startups/?ncid=em-even-511353-vt53&nvweb_e=&mkt_tok=MTU2LU9GTi03NDIAAAGgyaJn1WUfrxhH43ovtwTdC_rG321mnwq0cbQ9CEJ2XbvZXRLL7KusQ_vPt6DC3_BRV-qBgU024vMbOIIYOEpDJ8jUnKLz4Kt-8IQbcR38AGjpuP-ZCGHosA";
const SFH_AUTH_LINK = "https://startupfactoryhub.com/auth";
const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";
const nvidiaImageUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/NVIDIA-2.jpeg";

// SVG icons for email (inline, no emoji)
const icons = {
  gpu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  support: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px"><path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg>`,
  investor: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  brain: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"/><path d="M8 14s-4 2-4 6v1h16v-1c0-4-4-6-4-6"/></svg>`,
  megaphone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  graduation: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76b900" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polyline points="20 6 9 17 4 12"/></svg>`,
  arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:6px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
};

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
    const companyLine = companyName ? `<tr><td style="color:#9ca3af;font-size:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">Company</td><td style="color:#f3f4f6;font-size:14px;font-weight:600;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right">${companyName}</td></tr>` : '';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;background-color:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1419;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(14,162,112,0.3);">
        
        <!-- Header -->
        <tr><td style="background:#0ea270;padding:40px 32px;text-align:center;">
          <img src="${logoUrl}" alt="Startup Factory Hub" width="80" height="80" style="display:block;margin:0 auto 16px;border-radius:16px;" />
          <h1 style="color:#fff;font-size:26px;font-weight:700;margin:0;">Startup Factory Hub</h1>
          <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:6px 0 0;">AI-Powered Startup Accelerator Platform</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:linear-gradient(180deg,#1a1f35 0%,#0f1419 100%);padding:32px;text-align:center;">
          <img src="${nvidiaImageUrl}" alt="NVIDIA Inception Program" width="160" style="display:block;margin:0 auto 20px;border-radius:12px;" />
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="background:rgba(118,185,0,0.15);border:1px solid rgba(118,185,0,0.3);color:#76b900;padding:8px 20px;border-radius:50px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Always Open</td></tr></table>
          <h2 style="color:#fff;font-size:26px;font-weight:700;margin:0 0 8px;">You're Invited to NVIDIA Inception</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0;">Join the world's premier program for cutting-edge startups through our direct partnership link.</p>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:32px;background:#0f1419;">
          
          <!-- Brought by -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(14,162,112,0.1),rgba(118,185,0,0.1));border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:20px;margin-bottom:24px;">
            <tr><td style="text-align:center;">
              <p style="color:#0ea270;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">Brought to you by</p>
              <p style="color:#f3f4f6;font-size:18px;font-weight:700;margin:0;">Startup Factory Hub</p>
              <p style="color:#9ca3af;font-size:13px;margin:4px 0 0;">Venture Fund: <strong style="color:#76b900;">Decahedron Ventures</strong></p>
            </td></tr>
          </table>

          <p style="color:#e5e7eb;font-size:16px;line-height:1.7;margin:0 0 24px;">${greeting}</p>
          <p style="color:#e5e7eb;font-size:15px;line-height:1.7;margin:0 0 24px;">We are excited to invite you to apply for the <strong style="color:#76b900;">NVIDIA Inception Program</strong> through Startup Factory Hub's exclusive partnership link, powered by our venture fund <strong style="color:#0ea270;">Decahedron Ventures</strong>.</p>

          ${companyLine ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border-radius:12px;padding:24px;border:1px solid rgba(14,162,112,0.2);margin-bottom:24px;">
            <tr><td colspan="2" style="color:#0ea270;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:16px;">Your Details</td></tr>
            ${companyLine}
            <tr><td style="color:#9ca3af;font-size:14px;padding:10px 0;">Invited To</td><td style="color:#f3f4f6;font-size:14px;font-weight:600;padding:10px 0;text-align:right">${to}</td></tr>
          </table>
          ` : ''}

          <!-- Benefits -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border-radius:12px;padding:24px;border:1px solid rgba(14,162,112,0.2);margin-bottom:24px;">
            <tr><td style="color:#0ea270;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:16px;">Program Benefits</td></tr>
            <tr><td style="color:#e5e7eb;font-size:14px;padding:8px 0;line-height:1.5;">${icons.gpu} GPU credits and cloud computing resources</td></tr>
            <tr><td style="color:#e5e7eb;font-size:14px;padding:8px 0;line-height:1.5;">${icons.support} Technical support from NVIDIA engineers</td></tr>
            <tr><td style="color:#e5e7eb;font-size:14px;padding:8px 0;line-height:1.5;">${icons.investor} Investor connections and fundraising support</td></tr>
            <tr><td style="color:#e5e7eb;font-size:14px;padding:8px 0;line-height:1.5;">${icons.brain} Access to NVIDIA expertise and deep learning tools</td></tr>
            <tr><td style="color:#e5e7eb;font-size:14px;padding:8px 0;line-height:1.5;">${icons.megaphone} Co-marketing and brand exposure opportunities</td></tr>
            <tr><td style="color:#e5e7eb;font-size:14px;padding:8px 0;line-height:1.5;">${icons.graduation} Exclusive training on AI, data science &amp; HPC</td></tr>
          </table>

          <!-- Steps -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border-radius:12px;padding:24px;border:1px solid rgba(14,162,112,0.2);margin-bottom:24px;">
            <tr><td style="color:#0ea270;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:16px;">How to Apply</td></tr>
            <tr><td style="padding-bottom:16px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;height:32px;background:#0ea270;border-radius:50%;text-align:center;vertical-align:middle;color:#fff;font-size:14px;font-weight:700;">1</td>
                <td style="padding-left:16px;">
                  <p style="color:#f3f4f6;font-size:14px;font-weight:600;margin:0 0 2px;">Sign in to Startup Factory Hub</p>
                  <p style="color:#9ca3af;font-size:13px;margin:0;">Track your application and access accelerator resources</p>
                </td>
              </tr></table>
            </td></tr>
            <tr><td style="padding-bottom:16px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;height:32px;background:#0ea270;border-radius:50%;text-align:center;vertical-align:middle;color:#fff;font-size:14px;font-weight:700;">2</td>
                <td style="padding-left:16px;">
                  <p style="color:#f3f4f6;font-size:14px;font-weight:600;margin:0 0 2px;">Apply via NVIDIA</p>
                  <p style="color:#9ca3af;font-size:13px;margin:0;">Click the button below to apply through our direct link</p>
                </td>
              </tr></table>
            </td></tr>
            <tr><td>
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;height:32px;background:#0ea270;border-radius:50%;text-align:center;vertical-align:middle;color:#fff;font-size:14px;font-weight:700;">3</td>
                <td style="padding-left:16px;">
                  <p style="color:#f3f4f6;font-size:14px;font-weight:600;margin:0 0 2px;">Access resources &amp; support</p>
                  <p style="color:#9ca3af;font-size:13px;margin:0;">Get mentorship, networking, and tools via Decahedron Ventures</p>
                </td>
              </tr></table>
            </td></tr>
          </table>

          <!-- CTAs -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 16px;text-align:center;">
            <tr><td align="center">
              <a href="${NVIDIA_LINK}" style="display:inline-block;background:linear-gradient(135deg,#76b900,#5a8f00);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(118,185,0,0.4);">Apply to NVIDIA Inception ${icons.arrow}</a>
            </td></tr>
            <tr><td align="center" style="padding:16px 0;">
              <p style="color:#6b7280;font-size:13px;margin:0;">&mdash; then &mdash;</p>
            </td></tr>
            <tr><td align="center">
              <a href="${SFH_AUTH_LINK}" style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:600;box-shadow:0 6px 20px rgba(14,162,112,0.4);">Sign In to Startup Factory Hub</a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0a0f1e;padding:32px;text-align:center;border-top:1px solid rgba(14,162,112,0.15);">
          <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.7;" />
          <p style="color:#9ca3af;font-size:12px;font-weight:600;margin:0 0 4px;">Brought to you by Decahedron Ventures</p>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">This email was sent to <strong>${to}</strong> via Startup Factory Hub.</p>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:8px 0 0;">&copy; 2025 Startup Factory Hub &middot; <a href="https://startupfactoryhub.com" style="color:#0ea270;text-decoration:none;">startupfactoryhub.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
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
