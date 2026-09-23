// Sends the MVP Program acceptance email with a Stripe payment link for the program fee.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";
import { buildMvpFinalNoticeHtml, MVP_APPLY_URL } from "../_shared/mvp-final-notice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

// Program cost: $5,000 one-time per startup.
const DEFAULT_FEE_CENTS = 500000;

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

const MVP_BROCHURE_URL = "https://startupfactoryhub.com/forstartups";

const buildHtml = (opts: { name: string; startup: string; cohort: string; payUrl: string; amount: string }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You're accepted — Startup Factory Hub MVP Program</title></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border:1px solid rgba(139,92,246,0.22);border-radius:22px;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#8b5cf6 0%,#d946ef 50%,#06b6d4 100%);line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="background:#111827;padding:28px 32px 0;">
    <img src="${LOGO_URL}" alt="Startup Factory Hub" width="140" style="display:block;width:140px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>
  <tr><td style="background:#111827;padding:34px 32px 26px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#d946ef;text-transform:uppercase;">MVP Program &middot; ${esc(opts.cohort)}</div>
    <div style="margin:14px 0 0;color:#f3f4f6;font-size:24px;font-weight:800;line-height:1.25;">Congratulations — ${esc(opts.startup)} has been accepted</div>
    <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Hi ${esc(opts.name)}, after reviewing your application our team has selected your startup for the Startup Factory Hub MVP Development Program.</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">To confirm your seat, please complete the program payment below. Seats are limited and are confirmed in order of payment.</p>
  </td></tr>
  <tr><td style="padding:0 32px 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(217,70,239,0.08));border:1px solid rgba(139,92,246,0.22);border-radius:16px;">
      <tr><td style="padding:24px;text-align:center;">
        <div style="color:#94a3b8;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;">Program cost &middot; one-time payment</div>
        <div style="margin:6px 0 18px;color:#f3f4f6;font-size:34px;font-weight:900;">${esc(opts.amount)}</div>
        <a href="${opts.payUrl}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#d946ef 55%,#06b6d4);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;">Complete Your Payment &rarr;</a>
        <p style="margin:14px 0 0;color:#64748b;font-size:12px;word-break:break-all;">Or copy this link: <a href="${opts.payUrl}" style="color:#22d3ee;text-decoration:none;">${opts.payUrl}</a></p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05201a;border:1px solid rgba(34,211,238,0.16);border-radius:16px;">
      <tr><td style="padding:22px 24px;">
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#22d3ee;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:10px;">Program Brochure</div>
        <p style="margin:0 0 14px;color:#94a3b8;font-size:14px;line-height:1.7;">Review the full 4-week agenda, deliverables and what to expect before your batch kickoff.</p>
        <a href="${MVP_BROCHURE_URL}" style="display:inline-block;background:linear-gradient(135deg,#14b8a6 0%,#22d3ee 55%,#818cf8 100%);color:#05201a;font-size:14px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:999px;">Open MVP Program Brochure &rarr;</a>
        <p style="margin:12px 0 0;color:#64748b;font-size:12px;word-break:break-all;">${MVP_BROCHURE_URL}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <div style="background:#0f172a;border:1px solid rgba(34,211,238,0.12);border-radius:16px;padding:22px 24px;">
      <div style="color:#22d3ee;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">What happens next</div>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">Once your payment is confirmed you'll receive onboarding details, your batch schedule and access to the Startup Factory Hub platform, your assigned team and mentors.</p>
      <p style="margin:18px 0 0;color:#f3f4f6;font-size:14px;font-weight:600;">Welcome aboard,<br>Startup Factory Hub</p>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || body.founder_name || "Founder");
    const startup = String(body.startupName || body.startup_name || "Your startup");
    const cohort = String(body.cohortName || "MVP Program");
    const applicationId = String(body.applicationId || "");
    const amountCents = Number.isFinite(Number(body.amountCents)) && Number(body.amountCents) > 0
      ? Math.round(Number(body.amountCents))
      : DEFAULT_FEE_CENTS;

    if (body.validateTemplate === true) {
      return new Response(JSON.stringify({
        success: true,
        template: body.template === "final-notice" ? "final-notice" : "acceptance",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.template === "final-notice") {
      const deadline = String(body.deadline || "in 72 hours");
      const confirmUrl = String(body.confirmUrl || MVP_APPLY_URL);
      await sendCompliantEmail({
        to: email,
        subject: `Final notice: ${startup} loses its MVP Program seat on ${deadline}`,
        html: buildMvpFinalNoticeHtml({ name, startup, cohort, deadline, confirmUrl }),
        source: "mvp-final-notice",
      });
      return new Response(JSON.stringify({ success: true, template: "final-notice" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const origin = req.headers.get("origin") || "https://startupfactoryhub.com";

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `MVP Development Program — ${cohort}`,
            description: `Program cost for ${startup} (one-time payment)`,
          },
        },
        quantity: 1,
      }],
      success_url: `${origin}/mvp-program?payment=success`,
      cancel_url: `${origin}/mvp-program?payment=cancelled`,
      metadata: {
        type: "mvp_program_fee",
        application_id: applicationId,
        startup_name: startup,
      },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");

    await sendCompliantEmail({
      to: email,
      subject: `You're accepted — ${startup} · MVP Program payment`,
      html: buildHtml({ name, startup, cohort, payUrl: session.url, amount: money(amountCents) }),
      source: "mvp-acceptance",
    });

    return new Response(JSON.stringify({ success: true, paymentUrl: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-mvp-acceptance-email error", e);
    return new Response(JSON.stringify({ error: e?.message || "Failed to send" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
