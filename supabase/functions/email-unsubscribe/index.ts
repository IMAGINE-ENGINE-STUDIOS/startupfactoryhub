import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  MAILING_ADDRESS,
  ORG_NAME,
  SITE_URL,
  unsubscribeToken,
  verifyUnsubscribeToken,
} from "../_shared/email-compliance.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const page = (title: string, message: string, extra = "") => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#05100c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e6fff4;">
  <div style="max-width:520px;margin:12vh auto;padding:36px 28px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.18);border-radius:16px;text-align:center;">
    <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#34d399;">${ORG_NAME}</div>
    <h1 style="font-size:22px;margin:14px 0 10px;">${title}</h1>
    <p style="font-size:14px;color:#9fb4ab;line-height:1.6;">${message}</p>
    ${extra}
    <a href="${SITE_URL}" style="display:inline-block;margin-top:20px;padding:12px 26px;border-radius:10px;background:linear-gradient(135deg,#10b981,#0d9488);color:#04140e;font-weight:700;font-size:14px;text-decoration:none;">Back to the platform</a>
    <p style="margin-top:26px;font-size:11px;color:#6f877e;line-height:1.7;">${ORG_NAME}<br>${MAILING_ADDRESS}</p>
  </div>
</body></html>`;

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const email = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("t") ?? "";
  const source = url.searchParams.get("s") ?? null;
  const action = url.searchParams.get("action") ?? "unsubscribe";

  if (!email || !token || !(await verifyUnsubscribeToken(email, token))) {
    return html(
      page("Invalid link", "This unsubscribe link is not valid or has expired. Email info@startupfactoryhub.com and we will remove you right away."),
      400,
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Match the address to a member account when one exists (best effort).
  const { data: profile } = await supabase
    .from("profiles_data")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();

  if (action === "resubscribe") {
    await supabase.from("email_unsubscribes").delete().eq("email", email);
    if (profile?.user_id) {
      await supabase.from("profiles_data").update({ newsletter_opt_out: false }).eq("user_id", profile.user_id);
    }
    return html(page("You're subscribed again", `<strong>${email}</strong> will receive emails from ${ORG_NAME} again.`));
  }

  const { error } = await supabase
    .from("email_unsubscribes")
    .upsert({ email, source, user_id: profile?.user_id ?? null, unsubscribed_at: new Date().toISOString() }, { onConflict: "email" });

  if (error) {
    console.error("email-unsubscribe error:", error.message);
    return html(
      page("Something went wrong", "We could not process your request automatically. Please email info@startupfactoryhub.com and we will remove you manually."),
      500,
    );
  }

  if (profile?.user_id) {
    await supabase.from("profiles_data").update({ newsletter_opt_out: true }).eq("user_id", profile.user_id);
  }

  const resubUrl = `${SUPABASE_URL}/functions/v1/email-unsubscribe?e=${encodeURIComponent(email)}&t=${await unsubscribeToken(email)}&action=resubscribe`;

  return html(
    page(
      "You're unsubscribed",
      `<strong>${email}</strong> has been removed from our mailing list. This took effect immediately — no further action is needed.`,
      `<p style="font-size:12px;color:#6f877e;margin-top:14px;">Unsubscribed by mistake? <a href="${resubUrl}" style="color:#34d399;">Resubscribe</a></p>`,
    ),
  );
});
