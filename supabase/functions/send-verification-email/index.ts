import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://startupfactoryhub.com";
const MVP_APPLICATION_URL = `${APP_URL}/cohorts/1b95239b-622b-4838-9b63-cfff2c54269e/apply`;
const AF_APPLICATION_URL = `${APP_URL}/cohorts/21bbf578-1347-43f8-bc56-d31fbd4af03d/apply`;
const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const buildHtml = (name: string, link: string, mvp: boolean, af = false) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your email</title></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f19;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border:1px solid rgba(139,92,246,0.22);border-radius:22px;overflow:hidden;">
  <tr><td style="height:4px;background:linear-gradient(90deg,#8b5cf6 0%,#d946ef 50%,#06b6d4 100%);line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td align="center" style="padding:28px 32px 0;">
    <img src="${LOGO_URL}" alt="Startup Factory Hub" width="140" style="display:block;width:140px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>
  <tr><td style="padding:32px 32px 26px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#d946ef;text-transform:uppercase;">Email verification</div>
    <div style="margin:14px 0 0;color:#f3f4f6;font-size:22px;font-weight:800;line-height:1.25;">Verify your email address</div>
    <p style="margin:14px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Hello ${esc(name)},</p>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:14px;line-height:1.7;">Please confirm your email address to activate your Startup Factory Hub account. This link expires in 24 hours.</p>
    <p style="margin:26px 0 0;text-align:center;">
      <a href="${esc(link)}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#d946ef 55%,#06b6d4);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;">Verify my email &rarr;</a>
    </p>
    <p style="margin:16px 0 0;color:#64748b;font-size:12px;word-break:break-all;text-align:center;">Or copy this link: <a href="${esc(link)}" style="color:#22d3ee;text-decoration:none;">${esc(link)}</a></p>
  </td></tr>
  ${mvp ? `
  <tr><td style="padding:0 32px 30px;">
    <div style="background:#0f172a;border:1px solid rgba(34,211,238,0.16);border-radius:16px;padding:22px 24px;">
      <div style="color:#22d3ee;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">MVP Development Program</div>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">You signed up interested in the MVP Program. After verifying your email, complete your application here:</p>
      <p style="margin:14px 0 0;text-align:center;">
        <a href="${MVP_APPLICATION_URL}" style="display:inline-block;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;border:1px solid rgba(34,211,238,0.35);background:rgba(34,211,238,0.08);">Complete your application</a>
      </p>
    </div>
  </td></tr>` : ""}
  ${af ? `
  <tr><td style="padding:0 32px 30px;">
    <div style="background:#0b1220;border:1px solid rgba(245,158,11,0.2);border-radius:16px;padding:22px 24px;">
      <div style="color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;">Accelerated Fundraising</div>
      <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">You signed up interested in the Accelerated Fundraising program for aerospace hardware startups. After verifying your email, complete your application here:</p>
      <p style="margin:14px 0 0;text-align:center;">
        <a href="${AF_APPLICATION_URL}" style="display:inline-block;color:#1a1200;font-size:13px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#fbbf24 55%,#fde68a);">Apply to Accelerated Fundraising</a>
      </p>
    </div>
  </td></tr>` : ""}
  <tr><td style="background:#0b0f19;padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;color:#64748b;font-size:12px;">If you did not create this account, you can safely ignore this email.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const service = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

async function sendFor(
  admin: ReturnType<typeof service>,
  email: string,
  name: string,
  mvp: boolean,
  af = false,
): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${APP_URL}/verify-email` },
  });
  if (error) throw new Error(`generateLink: ${error.message}`);
  const link = data?.properties?.action_link;
  if (!link) throw new Error("No action link returned");

  await sendCompliantEmail({
    to: email,
    subject: "Verify your email — Startup Factory Hub",
    html: buildHtml(name, link, mvp, af),
    source: "email-verification",
    skipSuppression: true, // transactional auth email
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const admin = service();
    const body = await req.json().catch(() => ({} as any));

    // ---- Backfill mode: admin only, re-sends to every unverified user ----
    if (body.backfill === true) {
      const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const { data: userData } = await admin.auth.getUser(token);
      const callerId = userData?.user?.id;
      if (!callerId) return json({ error: "Unauthorized" }, 401);
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
      if (!isAdmin) return json({ error: "Forbidden: admin only" }, 403);

      const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500);
      const dryRun = body.dryRun === true;

      // Collect unverified users across pages
      const unverified: { email: string; name: string; mvp: boolean; af: boolean }[] = [];
      for (let page = 1; page <= 20 && unverified.length < limit; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        const users = data?.users ?? [];
        if (users.length === 0) break;
        for (const u of users) {
          if (u.email_confirmed_at || !u.email) continue;
          unverified.push({
            email: u.email,
            name: (u.user_metadata?.full_name as string) || u.email.split("@")[0],
            mvp: String(u.user_metadata?.mvp_program ?? "") === "true",
            af: String(u.user_metadata?.accelerated_fundraising ?? "") === "true",
          });
          if (unverified.length >= limit) break;
        }
        if (users.length < 200) break;
      }

      if (dryRun) return json({ success: true, dryRun: true, count: unverified.length });

      let sent = 0;
      let mvpSent = 0;
      const failures: { email: string; error: string }[] = [];

      for (const u of unverified) {
        try {
          await sendFor(admin, u.email, u.name, u.mvp, u.af);
          sent++;
          if (u.af) {
            await admin.functions.invoke("send-af-welcome", { body: { email: u.email, name: u.name } });
          }
          if (u.mvp) {
            const { error: mvpErr } = await admin.functions.invoke("send-mvp-welcome", {
              body: { email: u.email, name: u.name },
            });
            if (!mvpErr) mvpSent++;
          }
        } catch (err: any) {
          failures.push({ email: u.email, error: String(err?.message ?? err).slice(0, 200) });
        }
        await new Promise((r) => setTimeout(r, 150));
      }

      console.log(`verification backfill: total=${unverified.length} sent=${sent} mvp=${mvpSent} failed=${failures.length}`);
      return json({ success: true, total: unverified.length, sent, mvpSent, failed: failures.length, failures });
    }

    // ---- Single mode: called right after signup ----
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ error: "Valid email is required" }, 400);

    const name = String(body.name || body.full_name || email.split("@")[0]);
    const mvp = body.mvpProgram === true || String(body.mvpProgram ?? "") === "true";
    const af = body.acceleratedFundraising === true || String(body.acceleratedFundraising ?? "") === "true";

    await sendFor(admin, email, name, mvp, af);
    return json({ success: true });
  } catch (error: any) {
    console.error("send-verification-email error:", error);
    return json({ error: error?.message ?? "Failed to send verification email" }, 500);
  }
});
