import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  token: string;
  to: string[];
  senderName?: string;
  message?: string;
  pdfBase64?: string;
  fileName?: string;
  notifyOwner?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      token,
      to,
      senderName,
      message,
      pdfBase64,
      fileName,
      notifyOwner = true,
    }: Payload = await req.json();

    if (!token || !Array.isArray(to) || to.length === 0) {
      return new Response(JSON.stringify({ error: "Missing token or recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: doc, error: docError } = await supabase
      .from("sign_documents")
      .select("id, title, owner_id, share_token")
      .eq("share_token", token)
      .maybeSingle();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Invalid document token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://startupfactoryhub.com";
    const url = `${origin}/sign/${doc.share_token}`;
    const from = senderName?.trim() || "Startup Factory Hub";

    const safe = (t?: string) => (t ? String(t).replace(/</g, "&lt;") : "");

    // The modern SFH email shell (same template system as send-mvp-program
    // and the member emails): dark #04140f page, #05201a card, teal-cyan-
    // indigo gradient bar, logo header band, mono kicker, gradient pill CTA.
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${safe(doc.title)}</title>
      </head>
      <body style="margin:0;padding:0;background:#04140f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">The signed copy of ${safe(doc.title)} is ready.</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04140f;padding:24px 12px;">
      <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#05201a;border:1px solid rgba(34,211,238,0.18);border-radius:22px;overflow:hidden;">
        <tr><td style="height:3px;background:linear-gradient(90deg,#14b8a6 0%,#22d3ee 50%,#818cf8 100%);line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr><td align="center" style="background:#062a21;padding:26px 32px 0;">
          <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="Startup Factory Hub" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;outline:none;" />
        </td></tr>
        <tr><td style="background:#062a21;padding:34px 32px 30px;">
          <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#22d3ee;text-transform:uppercase;">Signature Suite &middot; Signed Document</div>
          <div style="margin:14px 0 0;color:#f8fafc;font-size:25px;font-weight:800;line-height:1.25;">Signed document</div>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:13.5px;line-height:1.7;">The signed copy is ready — open it any time from this link.</p>
        </td></tr>
        <tr><td style="padding:24px 32px 0;">
          <p style="margin:0 0 8px;color:#e5e7eb;font-size:16px;line-height:1.6;">${safe(doc.title)}</p>
          <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">
            ${message ? String(message).replace(/</g, "&lt;") : `${safe(from)} shared the signed copy of this document with you.`}
          </p>
          ${pdfBase64 ? `<p style="margin:14px 0 0;color:#64748b;font-size:13px;">The signed PDF is attached to this email.</p>` : ""}
        </td></tr>
        <tr><td style="padding:26px 32px 30px;text-align:center;">
          <a href="${url}" style="display:inline-block;background:#0f766e;background-image:linear-gradient(135deg,#14b8a6,#22d3ee 55%,#818cf8);color:#05201a;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;letter-spacing:0.4px;">Open document</a>
          <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Or copy this link: <a href="${url}" style="color:#22d3ee;text-decoration:none;word-break:break-all;">${url}</a></p>
        </td></tr>
        <tr><td style="background:#031a14;padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;color:#64748b;font-size:12px;">Startup Factory Hub &middot; <a href="mailto:info@startupfactoryhub.com" style="color:#22d3ee;text-decoration:none;">info@startupfactoryhub.com</a></p>
        </td></tr>
      </table>
      </td></tr>
      </table>
      </body>
      </html>`;

    const attachments = pdfBase64
      ? [{ filename: fileName || "signed-document.pdf", content: pdfBase64 }]
      : undefined;

    const { error: sendError } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to,
      subject: `Signed document — ${doc.title}`,
      html,
      attachments,
    });

    if (sendError) {
      console.error("resend error", sendError);
      return new Response(JSON.stringify({ error: "Email delivery failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (notifyOwner && doc.owner_id) {
      await supabase.from("notifications").insert({
        user_id: doc.owner_id,
        title: "Signed document sent",
        message: `"${doc.title}" was sent to ${to.join(", ")}`,
        type: "success",
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-signed-document", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
