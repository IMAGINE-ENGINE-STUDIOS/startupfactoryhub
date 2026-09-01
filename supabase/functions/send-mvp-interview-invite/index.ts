import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
          <div style="margin:14px 0 0;color:#f3f4f6;font-size:22px;font-weight:800;line-height:1.25;">We reviewed your application</div>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Hello ${esc(name)}, how are you?</p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">We&rsquo;ve reviewed your application and are impressed by your project. We would like to invite you to a private <strong style="color:#e5e7eb;">1:1 interview</strong> with our team to learn more about your project, understand your goals, and determine whether it is a strong fit for our program.</p>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(217,70,239,0.08));border:1px solid rgba(139,92,246,0.22);border-radius:16px;">
            <tr><td style="padding:24px;text-align:center;">
              <a href="${CALENDLY_URL}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#d946ef 55%,#06b6d4);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;letter-spacing:0.4px;">Schedule Your 1:1 Interview &rarr;</a>
              <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Or copy this link: <a href="${CALENDLY_URL}" style="color:#22d3ee;text-decoration:none;">${CALENDLY_URL}</a></p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          <div style="background:#0f172a;border:1px solid rgba(34,211,238,0.12);border-radius:16px;padding:22px 24px;">
            <div style="color:#22d3ee;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">Important</div>
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">Because we work with a limited number of selected startups, participation is by invitation and subject to our selection process.</p>
            <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">We&rsquo;ll also use the interview to walk you through the program, what we provide, and what is required to participate.</p>
            <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">We look forward to learning more about what you&rsquo;re building.</p>
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
      subject: 'We reviewed your application — 1:1 interview invitation',
      html: buildHtml(name),
      source: 'mvp-interview-invite',
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error sending MVP interview invite email:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
