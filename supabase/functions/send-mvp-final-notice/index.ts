// Urgent final notice for accepted MVP Program startups that never signed up / confirmed.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

const MVP_BROCHURE_URL = "https://startupfactoryhub.com/forstartups";
const MVP_APPLY_URL = "https://startupfactoryhub.com/mvp-program";
const SUPPORT_EMAIL = "info@startupfactoryhub.com";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const buildMvpFinalNoticeHtml = (opts: {
  name: string;
  startup: string;
  cohort: string;
  deadline: string;
  confirmUrl: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Final notice — your MVP Program seat is about to be released</title></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your accepted seat in ${esc(opts.cohort)} will be released to the waitlist.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border:1px solid rgba(239,68,68,0.28);border-radius:22px;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#ef4444 0%,#f59e0b 50%,#06b6d4 100%);line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="background:#111827;padding:28px 32px 0;">
    <img src="${LOGO_URL}" alt="Startup Factory Hub" width="140" style="display:block;width:140px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>
  <tr><td style="background:#111827;padding:32px 32px 24px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#ef4444;text-transform:uppercase;">Final Notice &middot; ${esc(opts.cohort)}</div>
    <div style="margin:14px 0 0;color:#f3f4f6;font-size:24px;font-weight:800;line-height:1.25;">${esc(opts.startup)} — your seat is about to be released</div>
    <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Hi ${esc(opts.name)}, you were <strong style="color:#f3f4f6;">accepted</strong> into the Startup Factory Hub MVP Development Program, but we still have no record of your registration.</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">If we don't hear from you by <strong style="color:#f59e0b;">${esc(opts.deadline)}</strong>, your place goes to the next startup on the waitlist — and the batch will close without you.</p>
  </td></tr>
  <tr><td style="padding:0 32px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(245,158,11,0.08));border:1px solid rgba(239,68,68,0.24);border-radius:16px;">
      <tr><td style="padding:22px 24px;text-align:center;">
        <div style="color:#fca5a5;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;">Deadline to confirm</div>
        <div style="margin:6px 0 16px;color:#f3f4f6;font-size:26px;font-weight:900;">${esc(opts.deadline)}</div>
        <a href="${opts.confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#f59e0b 55%,#06b6d4);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:999px;">Confirm My Seat &rarr;</a>
        <p style="margin:14px 0 0;color:#64748b;font-size:12px;word-break:break-all;">Or copy this link: <a href="${opts.confirmUrl}" style="color:#22d3ee;text-decoration:none;">${opts.confirmUrl}</a></p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 22px;">
    <div style="background:#05201a;border:1px solid rgba(34,211,238,0.16);border-radius:16px;padding:22px 24px;">
      <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#22d3ee;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:10px;">What you would be walking away from</div>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">This is your chance to build your product at a fraction of what it would cost you alone — with an engineering and design team, weekly mentorship, and a global network of founders, partners and investors behind you. Very few startups get this seat.</p>
      <a href="${MVP_BROCHURE_URL}" style="display:inline-block;margin-top:14px;background:linear-gradient(135deg,#14b8a6 0%,#22d3ee 55%,#818cf8 100%);color:#05201a;font-size:14px;font-weight:800;text-decoration:none;padding:12px 26px;border-radius:999px;">Review the Program Brochure &rarr;</a>
    </div>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <div style="background:#0f172a;border:1px solid rgba(245,158,11,0.18);border-radius:16px;padding:22px 24px;">
      <div style="color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">Need financial support?</div>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">If cost is what's holding you back, don't drop out in silence. We have a financing program for selected startups. Write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#22d3ee;text-decoration:none;font-weight:700;">${SUPPORT_EMAIL}</a> to see if you qualify — before the deadline above.</p>
      <p style="margin:18px 0 0;color:#f3f4f6;font-size:14px;font-weight:600;">We'd rather build with you,<br>Startup Factory Hub</p>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const email = body.email || body.to;
    const name = body.name || "Founder";
    const startup = body.startupName || "Your startup";
    const cohort = body.cohortName || "MVP Program";
    const deadline = body.deadline || "in 72 hours";
    const confirmUrl = body.confirmUrl || MVP_APPLY_URL;

    if (!email || !String(email).includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendCompliantEmail({
      to: email,
      subject: `Final notice — ${startup}'s seat in the MVP Program expires ${deadline}`,
      html: buildMvpFinalNoticeHtml({ name, startup, cohort, deadline, confirmUrl }),
      source: "mvp-final-notice",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-mvp-final-notice error", e);
    return new Response(JSON.stringify({ error: e?.message || "Failed to send" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
