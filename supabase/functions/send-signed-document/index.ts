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

    const html = `
      <!DOCTYPE html><html><body style="margin:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding:24px">
        <div style="max-width:600px;margin:0 auto;background:#0f1419;border-radius:16px;overflow:hidden;border:1px solid rgba(14,162,112,0.25)">
          <div style="background:linear-gradient(135deg,#0ea270,#059669);padding:28px 32px">
            <p style="margin:0;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:2px;text-transform:uppercase">Startup Factory Hub · Signature Suite</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px">Signed document</h1>
          </div>
          <div style="padding:28px 32px">
            <h2 style="margin:0 0 12px;color:#f3f4f6;font-size:18px">${doc.title}</h2>
            <p style="margin:0 0 18px;color:#9ca3af;font-size:14px;line-height:1.7">
              ${message ? String(message).replace(/</g, "&lt;") : `${from} shared the signed copy of this document with you.`}
            </p>
            ${pdfBase64 ? `<p style="margin:0 0 18px;color:#6b7280;font-size:13px">The signed PDF is attached to this email.</p>` : ""}
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">Open document</a>
            <p style="margin:18px 0 0;color:#4b5563;font-size:12px;word-break:break-all">${url}</p>
          </div>
          <div style="padding:20px 32px;border-top:1px solid rgba(14,162,112,.12)">
            <p style="margin:0;color:#6b7280;font-size:12px">Startup Factory Hub · <a href="mailto:info@startupfactoryhub.com" style="color:#0ea270;text-decoration:none">info@startupfactoryhub.com</a></p>
          </div>
        </div>
      </body></html>`;

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
