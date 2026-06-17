import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://startupfactoryhub.com";
const FROM = "Startup Factory Hub <info@startupfactoryhub.com>";

function buildEmail(opts: { fullName?: string | null; token: string }) {
  const name = opts.fullName?.trim() || "there";
  const link = `${APP_URL}/activate/${opts.token}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Activate your Intern Profile</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1a1f2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#0ea270,#059669);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.3px;">Startup Factory Hub</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Intern Program</p>
        </td></tr>

        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1f2e;">Welcome, ${name}</h2>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3a4154;">
            We are excited to share that <strong>Startup Factory Hub</strong> has launched a new platform to manage every aspect of our internship program in one place. Your profile is ready &mdash; you just need to activate it.
          </p>

          <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a1f2e;">Once activated, you will be able to:</p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.8;color:#3a4154;">
            <li>Track your assigned tasks and progress</li>
            <li>Connect and message your mentors directly</li>
            <li>Join events, workshops, and community sessions</li>
            <li>Earn and download official certificates</li>
          </ul>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr><td align="center">
            <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(14,162,112,0.3);">Activate Your Profile</a>
          </td></tr></table>

          <div style="background:#f8fafc;border-left:3px solid #0ea270;padding:18px 20px;border-radius:6px;margin:24px 0;">
            <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#1a1f2e;">How to activate &mdash; 3 quick steps</p>
            <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#3a4154;">
              <li>Click the <strong>Activate Your Profile</strong> button above.</li>
              <li>Set a password for your new account.</li>
              <li>Complete your profile and explore your dashboard.</li>
            </ol>
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
            Button not working? Copy and paste this link into your browser:<br>
            <a href="${link}" style="color:#0ea270;word-break:break-all;">${link}</a>
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px;background:#fafbfc;border-top:1px solid #eef0f3;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">This activation link expires in 30 days.</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">Need help? Reply to this email or contact <a href="mailto:info@startupfactoryhub.com" style="color:#0ea270;">info@startupfactoryhub.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const ids: string[] | undefined = body?.invitationIds;
    const sendAllPending: boolean = !!body?.sendAllPending;

    let query = admin
      .from("intern_invitations")
      .select("id, email, full_name, invite_token, status");

    if (sendAllPending) {
      query = query.in("status", ["pending", "sent"]);
    } else if (Array.isArray(ids) && ids.length > 0) {
      query = query.in("id", ids);
    } else {
      return new Response(JSON.stringify({ error: "No invitations specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invitations, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    let sent = 0;
    const failures: { email: string; reason: string }[] = [];

    for (const inv of invitations || []) {
      try {
        const html = buildEmail({ fullName: inv.full_name, token: inv.invite_token });
        const result = await resend.emails.send({
          from: FROM,
          to: [inv.email],
          subject: "Welcome to Startup Factory Hub — Activate Your Intern Profile",
          html,
        });

        if ((result as any)?.error) {
          failures.push({ email: inv.email, reason: JSON.stringify((result as any).error) });
          continue;
        }

        await admin
          .from("intern_invitations")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", inv.id);

        sent++;
        // small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        failures.push({ email: inv.email, reason: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ sent, total: invitations?.length || 0, failures }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
