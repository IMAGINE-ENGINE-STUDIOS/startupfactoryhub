import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

/** The $950/mo office add-on is the platform's Global Venture Partner plan —
 *  companies register on the platform and the plan is billed via Stripe
 *  there (founder rule, 2026-11-06). */
const REGISTRATION_URL = "https://startupfactoryhub.com/memberships";

/** The modern SFH email shell (same design system as send-equity-contract). */
const modernShell = (opts: {
  title: string;
  preheader: string;
  kicker: string;
  heading: string;
  intro: string;
  body: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#04140f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04140f;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#05201a;border:1px solid rgba(34,211,238,0.18);border-radius:22px;overflow:hidden;">

  <tr><td style="height:3px;background:linear-gradient(90deg,#14b8a6 0%,#22d3ee 50%,#818cf8 100%);line-height:3px;font-size:0;">&nbsp;</td></tr>

  <tr><td align="center" style="background:#062a21;padding:26px 32px 0;">
    <img src="${LOGO_URL}" alt="Startup Factory Hub" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>

  <tr><td style="background:#062a21;padding:34px 32px 30px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#22d3ee;text-transform:uppercase;">${opts.kicker}</div>
    <div style="margin:14px 0 0;color:#f8fafc;font-size:25px;font-weight:800;line-height:1.25;">${opts.heading}</div>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:13.5px;line-height:1.7;">${opts.intro}</p>
  </td></tr>

  ${opts.body}

  <tr><td style="background:#031a14;padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Imagine Engine Studios Corp d/b/a Startup Factory Hub &middot; 6900 Tavistock Lakes Blvd, Suite 400, Orlando, FL 32827</p>
    <p style="margin:0;color:#475569;font-size:11px;">Questions? Reply to this email or write to <a href="mailto:info@startupfactoryhub.com" style="color:#22d3ee;text-decoration:none;">info@startupfactoryhub.com</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const paragraph = (html: string) =>
  `<tr><td style="padding:24px 32px 0;"><p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">${html}</p></td></tr>`;

const docCard = (title: string, termsLine: string) => `
  <tr><td style="padding:20px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#083026;border:1px solid rgba(34,211,238,0.16);border-radius:16px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#64748b;font-size:9px;letter-spacing:1.6px;">YOUR PLAN</div>
        <div style="color:#f3f4f6;font-size:15px;font-weight:700;margin-top:5px;">${title}</div>
        <div style="color:#94a3b8;font-size:12.5px;margin-top:6px;">${termsLine}</div>
      </td></tr>
    </table>
  </td></tr>`;

const ctaBlock = (label: string, url: string) => `
  <tr><td style="padding:26px 32px 6px;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#0f766e;background-image:linear-gradient(135deg,#14b8a6,#22d3ee 55%,#818cf8);color:#05201a;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;letter-spacing:0.4px;">${label}</a>
    <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Or copy this link: <a href="${url}" style="color:#22d3ee;text-decoration:none;word-break:break-all;">${url}</a></p>
  </td></tr>`;

const foundersBlock = (partnersUrl: string) => `
  <tr><td style="padding:22px 32px 30px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#14b8a6;font-size:10px;font-weight:700;letter-spacing:1.8px;margin-bottom:8px;">STARTUP FACTORY HUB FOUNDERS</div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.7;">
      Khalia Padilla — Managing Partner &amp; Founder<br/>
      Ricardo Font — Managing Partner &amp; Founder
    </p>
    <p style="margin:12px 0 0;font-size:13px;">
      <a href="${partnersUrl}" style="color:#22d3ee;text-decoration:none;">Learn more about us →</a>
    </p>
  </td></tr>`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ContractValues {
  companyName?: string;
  companyNoticeEmail?: string;
  officeAddonElected?: string;
  officeAddonStart?: string;
}

const extractValues = (html: string | null): ContractValues | null => {
  if (!html) return null;
  const m = html.match(/SFH_CONTRACT_VALUES:([^>]*)-->/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as ContractValues;
  } catch {
    return null;
  }
};

const prettyDate = (iso?: string) => {
  if (!iso) return "the Monday after you sign";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

/**
 * Founder rule (2026-11-06): when a signed Accelerator Program Agreement
 * elects the Unlimited Office Access add-on, the company receives a second
 * email with the registration link to the platform for the $950 plan
 * (Global Venture Partner — billed monthly via Stripe on the platform).
 * Invoked fire-and-forget by the signing page after a signature lands;
 * every guard failure is a quiet skip, never an error for the signer.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token }: { token?: string } = await req.json().catch(() => ({}));
    if (!token) return json({ error: "Missing token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: doc } = await supabase
      .from("sign_documents")
      .select("id, title, recipient_email, recipient_name, content_html, source_type")
      .eq("share_token", token)
      .maybeSingle();

    if (!doc) return json({ error: "Invalid document token" }, 404);
    if (doc.source_type !== "equity_contract") return json({ skipped: "not a contract" });

    const values = extractValues(doc.content_html);
    if (!values || values.officeAddonElected !== "yes") {
      return json({ skipped: "office add-on not elected" });
    }

    const { count } = await supabase
      .from("sign_signatures")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id);
    if (!count || count < 1) return json({ skipped: "not signed yet" });

    const to = doc.recipient_email || values.companyNoticeEmail;
    if (!to) return json({ skipped: "no recipient email" });

    const safe = (s?: string | null) => (s ? String(s).replace(/</g, "&lt;") : "");
    const company = values.companyName?.trim() || doc.recipient_name || "your company";
    const start = prettyDate(values.officeAddonStart);

    const html = modernShell({
      title: "Your Unlimited Office Access — register to activate your $950 plan",
      preheader: `Your office access starts ${start} — register on the platform to activate your $950 plan.`,
      kicker: "Accelerator Program &middot; Office Access",
      heading: "Unlimited Office Access — one more step",
      intro: `Your signed agreement elects the Unlimited Office Access add-on. Your office access starts ${start}.`,
      body:
        paragraph(
          `Hello ${safe(doc.recipient_name) || "there"},<br/><br/>` +
            `The Accelerator Program Participation Agreement signed by <strong style="color:#e5e7eb">${safe(company)}</strong> includes the ` +
            `<strong style="color:#e5e7eb">Unlimited Office Access</strong> add-on. The add-on runs on the platform's ` +
            `<strong style="color:#e5e7eb">Global Venture Partner</strong> plan at <strong style="color:#e5e7eb">$950 per month</strong>, billed monthly via Stripe. ` +
            `Register on the platform from the link below to activate the plan — your office access begins ${start}.`
        ) +
        docCard(
          "Global Venture Partner — $950 / month",
          `Unlimited Office Access &middot; starts ${start} &middot; billed monthly via Stripe`
        ) +
        ctaBlock("Register & activate your office plan", REGISTRATION_URL) +
        foundersBlock("https://startupfactoryhub.com/forpartners"),
    });

    const { error } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [to],
      subject: "Your Unlimited Office Access — register to activate your $950 plan",
      html,
    });

    if (error) {
      console.error("resend error", error);
      return json({ error: "Email delivery failed" }, 502);
    }

    return json({ success: true, to });
  } catch (e) {
    console.error("send-office-plan-email", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
