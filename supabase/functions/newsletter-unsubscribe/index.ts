import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const page = (title: string, message: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#05100c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e6fff4;">
  <div style="max-width:520px;margin:12vh auto;padding:36px 28px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.18);border-radius:16px;text-align:center;">
    <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#34d399;">Startup Factory Hub</div>
    <h1 style="font-size:22px;margin:14px 0 10px;">${title}</h1>
    <p style="font-size:14px;color:#9fb4ab;line-height:1.6;">${message}</p>
    <a href="https://startupfactoryhub.com" style="display:inline-block;margin-top:20px;padding:12px 26px;border-radius:10px;background:linear-gradient(135deg,#10b981,#0d9488);color:#04140e;font-weight:700;font-size:14px;text-decoration:none;">Back to the platform</a>
  </div>
</body></html>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const userId = url.searchParams.get("u") ?? "";

  if (!UUID_RE.test(userId)) {
    return new Response(page("Invalid link", "This unsubscribe link is not valid."), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await supabase
    .from("profiles_data")
    .update({ newsletter_opt_out: true })
    .eq("user_id", userId);

  if (error) {
    console.error("newsletter-unsubscribe error:", error.message);
    return new Response(page("Something went wrong", "We could not update your preference. Please try again later."), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(
    page("You're unsubscribed", "You will no longer receive the Weekly Investment Brief. You can re-enable it any time from your profile settings."),
    { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
});
