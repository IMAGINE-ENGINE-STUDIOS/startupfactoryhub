import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  to: string;
  recipientName?: string;
  companyName?: string;
  documentTitle: string;
  shareToken: string;
  senderName?: string;
  message?: string;
  /** True when the agreement goes out with its custom terms blank — the
   *  company completes them from the link before signing (founder flow,
   *  2026-11-05). The email copy and CTA follow the path taken. */
  blank?: boolean;
}

const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

/**
 * The modern SFH email shell — the platform's current template system
 * (same design as send-mvp-program and the member emails): dark #04140f
 * page, #05201a card, teal→cyan→indigo gradient bar, SFH logo header band,
 * mono kickers, gradient pill CTA, #031a14 footer band. Contract emails use
 * this shell — never a plainer one-off design (founder, 2026-11-05).
 */
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
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#64748b;font-size:9px;letter-spacing:1.6px;">DOCUMENT</div>
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      to,
      recipientName,
      companyName,
      documentTitle,
      shareToken,
      senderName,
      message,
      blank,
    }: Payload = await req.json();

    if (!to || !shareToken) {
      return new Response(JSON.stringify({ error: "Missing recipient or document" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://startupfactoryhub.com";
    const signUrl = `${origin}/sign/${shareToken}`;
    const partnersUrl = "https://startupfactoryhub.com/forpartners";
    const from = senderName?.trim() || "Startup Factory Hub";
    const safe = (s?: string) => (s ? String(s).replace(/</g, "&lt;") : "");

    const defaultMessage = blank
      ? `${safe(from)} has sent you the Startup Factory Hub <strong style="color:#e5e7eb">Accelerator Program Participation Agreement</strong>${
          companyName ? ` for <strong style="color:#e5e7eb">${safe(companyName)}</strong>` : ""
        } with its custom terms blank for your company to complete. Open the agreement, fill in your company's terms — company name, equity percentage, total raised, and the rest of Schedule A, including whether you elect the Unlimited Office Access add-on — then review the completed agreement and sign. Your signature is recorded and the signed copy is stored securely.`
      : `${safe(from)} has prepared the Startup Factory Hub <strong style="color:#e5e7eb">Accelerator Program Participation Agreement</strong>${
          companyName ? ` for <strong style="color:#e5e7eb">${safe(companyName)}</strong>` : ""
        }. Please review the full document and sign it electronically — your signature is recorded and the signed copy is stored securely.`;

    const html = modernShell({
      title: documentTitle,
      preheader: blank
        ? "Your Accelerator Program Participation Agreement is ready — complete your company's terms and sign."
        : "Your Accelerator Program Participation Agreement is ready for your signature.",
      kicker: blank
        ? "Accelerator Program &middot; Complete &amp; Sign"
        : "Accelerator Program &middot; Agreement for Signature",
      heading: "Accelerator Program Participation Agreement",
      intro: blank
        ? "Your company's custom terms are blank for you to complete — it takes a few minutes, then you sign."
        : "Your agreement is ready. Review it in full and sign electronically.",
      body:
        paragraph(
          `Hello ${safe(recipientName) || "there"},<br/><br/>${safe(message) || defaultMessage}`
        ) +
        docCard(
          safe(documentTitle),
          blank
            ? "Terms: completed by your company from this link, before signing"
            : "Terms: pre-filled by Startup Factory Hub — review before signing"
        ) +
        ctaBlock(blank ? "Complete & sign the agreement" : "Review & sign the agreement", signUrl) +
        foundersBlock(partnersUrl),
    });

    const { error } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [to],
      subject: blank
        ? `Complete and sign — ${documentTitle}`
        : `Signature requested — ${documentTitle}`,
      html,
    });

    if (error) {
      console.error("resend error", error);
      return new Response(JSON.stringify({ error: "Email delivery failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-equity-contract", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
