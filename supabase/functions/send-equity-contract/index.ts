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
}

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

    const html = `
      <!DOCTYPE html><html><body style="margin:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding:24px">
        <div style="max-width:620px;margin:0 auto;background:#0f1419;border-radius:16px;overflow:hidden;border:1px solid rgba(14,162,112,0.25)">
          <div style="background:linear-gradient(135deg,#0ea270,#059669);padding:28px 32px">
            <p style="margin:0;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:2px;text-transform:uppercase">Startup Factory Hub · Accelerator</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px">Equity agreement for signature</h1>
          </div>
          <div style="padding:28px 32px">
            <p style="margin:0 0 14px;color:#d1d5db;font-size:15px">Hello ${safe(recipientName) || "there"},</p>
            <p style="margin:0 0 18px;color:#9ca3af;font-size:14px;line-height:1.7">
              ${safe(message) || `${safe(from)} has prepared the Startup Factory Hub Accelerator Agreement${companyName ? ` for <strong style="color:#e5e7eb">${safe(companyName)}</strong>` : ""}. Please review the full document and sign it electronically — your signature is recorded and the signed copy is stored securely.`}
            </p>
            <div style="background:#131a24;border:1px solid rgba(14,162,112,.2);border-radius:12px;padding:16px 18px;margin:0 0 22px">
              <p style="margin:0;color:#6b7280;font-size:11px;letter-spacing:1px;text-transform:uppercase">Document</p>
              <p style="margin:4px 0 0;color:#f3f4f6;font-size:15px;font-weight:600">${safe(documentTitle)}</p>
            </div>
            <a href="${signUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">Review &amp; sign the agreement</a>
            <p style="margin:16px 0 0;color:#4b5563;font-size:12px;word-break:break-all">${signUrl}</p>

            <div style="margin-top:26px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06)">
              <p style="margin:0 0 8px;color:#0ea270;font-size:11px;letter-spacing:1.4px;font-weight:700">STARTUP FACTORY HUB FOUNDERS</p>
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.7">
                Khalia Padilla — Managing Partner &amp; Founder<br/>
                Ricardo Font — Managing Partner &amp; Founder

              </p>
              <p style="margin:12px 0 0;color:#9ca3af;font-size:13px">
                <a href="${partnersUrl}" style="color:#0ea270;text-decoration:none">Learn more about us →</a>
              </p>
            </div>
          </div>
          <div style="padding:20px 32px;border-top:1px solid rgba(14,162,112,.12)">
            <p style="margin:0;color:#6b7280;font-size:12px">Imagine Engine Studios Corp · 6900 Tavistock Lakes Blvd SE, Suite 400, Orlando, FL 32827 · <a href="mailto:info@startupfactoryhub.com" style="color:#0ea270;text-decoration:none">info@startupfactoryhub.com</a></p>
          </div>
        </div>
      </body></html>`;

    const { error } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [to],
      subject: `Signature requested — ${documentTitle}`,
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
