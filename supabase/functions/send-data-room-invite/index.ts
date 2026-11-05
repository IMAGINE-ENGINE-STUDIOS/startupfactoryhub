// Sends Investor Data Room access emails to approved investors (admin only).
// Credits: Imagine Engine Studios Corp.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://startupfactoryhub.com";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

function buildHtml(link: string): string {
  const safeLink = escapeHtml(link);
  const shared = link.includes("/data-room/shared/");
  const note = shared
    ? "This link opens the data room directly — no account or sign-in needed. It is personal to you, please do not forward it."
    : "If the link asks you to sign in, use this same email address — access is tied to it.";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0f0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px;box-sizing:border-box;">
    <div style="background:#101815;border:1px solid #1e2f27;border-radius:16px;overflow:hidden;">
      <div style="height:4px;background:linear-gradient(90deg,#0ea270,#34d399,#0ea270);"></div>
      <div style="padding:32px 32px 8px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#34d399;font-weight:700;">Startup Factory Hub</div>
        <h1 style="margin:12px 0 0;font-size:26px;line-height:1.25;color:#f2f7f4;font-weight:700;">Your Investor Data Room access is ready</h1>
        <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#9fb3a9;">
          You've been approved to open the Startup Factory Hub Investor Data Room — one secure place with the pitch deck,
          one-pager, partner network, accelerator startup contracts and company documents for your due diligence.
        </p>
        <div style="margin:28px 0;text-align:center;">
          <a href="${safeLink}" style="background:#0ea270;color:#ffffff;padding:14px 34px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Open the Data Room</a>
          <div style="margin-top:12px;font-size:12px;color:#6f857b;word-break:break-all;">Or copy this link: <a href="${safeLink}" style="color:#34d399;">${safeLink}</a></div>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#9fb3a9;">
          ${note}
        </p>
      </div>
      <div style="margin-top:28px;padding:18px 32px;border-top:1px solid #1e2f27;font-size:11px;color:#6f857b;line-height:1.6;">
        Confidential — intended only for the recipient. Please do not forward.<br/>
        Startup Factory Hub · info@startupfactoryhub.com · Built by Imagine Engine Studios Corp
      </div>
    </div>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await service.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "A valid recipient email is required" }, 400);
    const link = typeof body?.linkUrl === "string" && /^https:\/\//i.test(body.linkUrl)
      ? body.linkUrl
      : `${SITE}/data-room`;

    const { error } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [email],
      subject: "Your access to the Startup Factory Hub Investor Data Room",
      html: buildHtml(link),
    });
    if (error) {
      console.error("Resend error:", error);
      return json({ error: "Email provider rejected the send", details: error }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("send-data-room-invite failed:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
