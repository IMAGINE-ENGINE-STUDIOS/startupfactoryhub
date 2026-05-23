import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const body = await req.json().catch(() => ({}));
    const targetEmails: string[] | undefined = body?.targetEmails;
    const singleTo: string | undefined = body?.to;
    const investorCount: number = Number(body?.investorCount) || 200;
    const headline: string =
      body?.headline ||
      `${investorCount}+ active investors looking to back small businesses`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let recipients: { email: string; full_name: string | null }[] = [];
    if (Array.isArray(targetEmails) && targetEmails.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("email", targetEmails);
      const nameByEmail = new Map(
        (profs || []).map((p: any) => [p.email, p.full_name]),
      );
      recipients = targetEmails.map((email) => ({
        email,
        full_name: nameByEmail.get(email) ?? null,
      }));
    } else if (singleTo) {
      recipients = [{ email: singleTo, full_name: null }];
    } else {
      throw new Error("targetEmails (array) or to (string) is required");
    }

    const APP_URL = "https://startupfactoryhub.com";
    const REFERRAL_URL = `${APP_URL}/referral`;
    const INVESTORS_URL = `${APP_URL}/dashboard?tab=investors`;
    const LOGO =
      "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const buildHtml = (name: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 620px; margin: 0 auto; }
    .container { background: #0f1419; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(14,162,112,0.2); }
    .header { background: linear-gradient(135deg,#0ea270,#059669); padding: 36px 32px; text-align: center; }
    .header img.logo { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 12px; object-fit: contain; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; }
    .hero { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 40px 32px; text-align: center; }
    .badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #34d399; padding: 6px 18px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 18px; }
    .hero h2 { color: #f3f4f6; font-size: 28px; font-weight: 800; margin: 6px 0 12px; line-height: 1.2; }
    .hero h2 span { background: linear-gradient(135deg,#34d399,#0ea270); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero p { color: #9ca3af; font-size: 15px; line-height: 1.65; max-width: 480px; margin: 0 auto; }
    .stat-row { display: flex; gap: 12px; justify-content: center; margin: 22px 0 4px; }
    .stat-card { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(14,162,112,0.2); border-radius: 12px; padding: 16px 12px; max-width: 160px; }
    .stat-card .num { color: #34d399; font-size: 24px; font-weight: 800; }
    .stat-card .label { color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 22px; border: 1px solid rgba(14,162,112,0.18); margin-bottom: 16px; }
    .card-label { color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
    .card h3 { color: #f3f4f6; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.65; }
    .cta-section { text-align: center; padding: 8px 0 4px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff !important; text-decoration: none; padding: 15px 38px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,162,112,0.4); }
    .secondary-link { display: block; text-align: center; margin-top: 14px; color: #34d399; text-decoration: none; font-size: 13px; }
    .footer { background: #0a0f1e; padding: 26px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img class="logo" src="${LOGO}" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Platform Update</p>
      </div>

      <div class="hero">
        <div class="badge">What's new</div>
        <h2>Hi ${name}, <span>${investorCount}+ active investors</span> are looking to back small businesses</h2>
        <p>${headline}. Now is the right moment to update your profile, open your matches, and tell other founders to join.</p>

        <div class="stat-row">
          <div class="stat-card">
            <div class="num">${investorCount}+</div>
            <div class="label">Active investors</div>
          </div>
          <div class="stat-card">
            <div class="num">20%</div>
            <div class="label">Referral commission</div>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="card">
          <div class="card-label">Step 1 — Get matched</div>
          <h3>See the investors looking right now</h3>
          <p>Open the Investor Browser to view active investors, smart matches based on your stage and industry, and warm-intro requests.</p>
        </div>

        <div class="card">
          <div class="card-label">Step 2 — Refer a founder</div>
          <h3>Invite another founder, earn 20% commission</h3>
          <p>Every founder you refer who subscribes earns you a one-time 20% commission on their first month or year. Mentors and advisors earn 25%.</p>
        </div>

        <div class="cta-section">
          <a href="${INVESTORS_URL}" class="cta-btn">Open the Investor Browser</a>
          <a href="${REFERRAL_URL}" class="secondary-link">Refer a founder and earn commission</a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this as a member of Startup Factory Hub.</p>
        <p style="margin-top:6px">© 2025 <a href="${APP_URL}">Startup Factory Hub</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

    let sent = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const r of recipients) {
      if (!r.email) continue;
      const name = (r.full_name && r.full_name.trim()) || r.email.split("@")[0];

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Startup Factory Hub <info@startupfactoryhub.com>",
            to: [r.email],
            subject: `${investorCount}+ active investors are looking — and you can refer founders for 20%`,
            html: buildHtml(name),
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          errors++;
          const txt = await res.text();
          errorDetails.push(`${r.email}: ${txt}`);
          console.error(`Failed for ${r.email}:`, txt);
        }
        await new Promise((rs) => setTimeout(rs, 120));
      } catch (err: any) {
        errors++;
        errorDetails.push(`${r.email}: ${err.message}`);
        console.error(`Error for ${r.email}:`, err);
      }
    }

    console.log(`Investor update sent: ${sent} ok, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, sent, errors, errorDetails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-investor-update error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
