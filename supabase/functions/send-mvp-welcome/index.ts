import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MVP_APPLICATION_URL = 'https://startupfactoryhub.com/cohorts/1b95239b-622b-4838-9b63-cfff2c54269e/apply';
const CALENDLY_URL = 'https://calendly.com/startupfactoryhub/30min';
const LOGO_URL = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const buildHtml = (name: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Startup Factory Hub MVP Program</title>
</head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border:1px solid rgba(139,92,246,0.22);border-radius:22px;overflow:hidden;">
        <tr><td style="height:4px;background:linear-gradient(90deg,#8b5cf6 0%,#d946ef 50%,#06b6d4 100%);line-height:4px;font-size:0;">&nbsp;</td></tr>
        <tr><td align="center" style="background:#111827;padding:28px 32px 0;">
          <img src="${LOGO_URL}" alt="Startup Factory Hub" width="140" style="display:block;width:140px;max-width:60%;height:auto;border:0;outline:none;" />
        </td></tr>
        <tr><td style="background:#111827;padding:36px 32px 30px;">
          <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#d946ef;text-transform:uppercase;">Startup Factory Hub MVP Program</div>
          <div style="margin:14px 0 0;color:#f3f4f6;font-size:22px;font-weight:800;line-height:1.25;">Build your MVP in weeks</div>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Hello ${esc(name)},</p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Thank you for your interest in joining the Startup Factory Hub MVP Program!</p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">As a first step, please complete your application here:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;background:#0f172a;border:1px solid rgba(139,92,246,0.18);border-radius:16px;">
            <tr>
              <td style="padding:18px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
                <div style="color:#d946ef;font-size:17px;font-weight:800;">4 weeks</div>
                <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">DURATION</div>
              </td>
              <td style="padding:18px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
                <div style="color:#22d3ee;font-size:17px;font-weight:800;">100% Remote</div>
                <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">FORMAT</div>
              </td>
              <td style="padding:18px 10px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
                <div style="color:#818cf8;font-size:17px;font-weight:800;">$5,000</div>
                <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">PROGRAM COST</div>
              </td>
              <td style="padding:18px 10px;text-align:center;">
                <div style="color:#f3f4f6;font-size:15px;font-weight:800;">Limited</div>
                <div style="color:#64748b;font-size:10px;letter-spacing:1.4px;font-family:'SFMono-Regular',Consolas,monospace;">SEATS</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(217,70,239,0.08));border:1px solid rgba(139,92,246,0.22);border-radius:16px;">
            <tr><td style="padding:24px;text-align:center;">
              <a href="${MVP_APPLICATION_URL}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#d946ef 55%,#06b6d4);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;letter-spacing:0.4px;">Complete Your Application &rarr;</a>
              <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Or copy this link: <a href="${MVP_APPLICATION_URL}" style="color:#22d3ee;text-decoration:none;">${MVP_APPLICATION_URL}</a></p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <div style="background:#0f172a;border:1px solid rgba(34,211,238,0.12);border-radius:16px;padding:22px 24px;">
            <div style="color:#22d3ee;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">What happens next</div>
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">Our team will carefully review your application and project. If your startup is selected to move forward, we will invite you to a private 1:1 interview with our team to learn more about your company, goals, and vision, and to determine if the program is the right fit for you.</p>
            <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">If you have any questions about the application or would like to learn more about the program, you can schedule a 1:1 call with us here:</p>
            <p style="margin:10px 0 0;text-align:center;">
              <a href="${CALENDLY_URL}" style="display:inline-block;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border:1px solid rgba(34,211,238,0.35);background:rgba(34,211,238,0.08);">Schedule a 1:1 Call</a>
            </p>
            <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">We look forward to reviewing your application!</p>
            <p style="margin:18px 0 0;color:#f3f4f6;font-size:14px;font-weight:600;">Best,<br>Startup Factory Hub</p>
          </div>
        </td></tr>
        <tr><td style="background:#0b0f19;padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Startup Factory Hub &middot; A global, remote-first startup ecosystem</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || body.full_name || 'Founder');

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await sendCompliantEmail({
      to: email,
      subject: 'Complete your Startup Factory Hub MVP Program application',
      html: buildHtml(name),
      source: 'mvp-welcome',
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending MVP welcome email:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
