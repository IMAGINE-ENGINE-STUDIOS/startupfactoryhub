import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  full_name: string | null;
}

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
    const singleRecipientName: string | undefined = body?.recipientName;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve recipients
    let recipients: Recipient[] = [];
    if (Array.isArray(targetEmails) && targetEmails.length > 0) {
      // Try to enrich with names from profiles
      const { data: profs } = await supabase
        .from("profiles")
        .select("email, full_name")
        .in("email", targetEmails);

      const nameByEmail = new Map(
        (profs || []).map((p: any) => [p.email, p.full_name]),
      );
      recipients = targetEmails.map((email) => ({
        email,
        full_name: nameByEmail.get(email) ?? singleRecipientName ?? null,
      }));
    } else if (body?.to) {
      recipients = [{ email: body.to, full_name: singleRecipientName ?? null }];
    } else {
      throw new Error("targetEmails (array) or to (string) is required");
    }

    const APP_URL = "https://startupfactoryhub.com";
    const REFERRAL_URL = `${APP_URL}/referral`;
    const LOGO =
      "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const html = (recipientName: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 620px; margin: 0 auto; }
    .container { background: #0f1419; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(14,162,112,0.2); }
    .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 36px 32px; text-align: center; }
    .header img.logo { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 12px; object-fit: contain; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; }
    .hero { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 40px 32px; text-align: center; }
    .badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #34d399; padding: 6px 18px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 18px; }
    .hero h2 { color: #f3f4f6; font-size: 30px; font-weight: 800; margin: 8px 0 12px; line-height: 1.2; }
    .hero h2 span { background: linear-gradient(135deg,#34d399,#0ea270); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero p { color: #9ca3af; font-size: 15px; line-height: 1.65; max-width: 460px; margin: 0 auto; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 22px; border: 1px solid rgba(14,162,112,0.18); margin-bottom: 16px; }
    .card-label { color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; }
    .card h3 { color: #f3f4f6; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.65; }
    .step { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .step:last-child { border-bottom: none; }
    .step-num { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
    .step-body h4 { color: #f3f4f6; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .step-body p { color: #9ca3af; font-size: 13px; line-height: 1.55; }
    .step-body code { background: rgba(14,162,112,0.12); color: #34d399; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: 'SF Mono', Menlo, monospace; }
    table.commission { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: auto; }
    table.commission th, table.commission td { padding: 8px 6px; text-align: left; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    table.commission th { color: #9ca3af; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.4px; }
    table.commission td { color: #d1d5db; }
    table.commission td.amount { color: #34d399; font-weight: 700; text-align: right; }
    .cta-section { text-align: center; padding: 8px 0 4px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff !important; text-decoration: none; padding: 15px 38px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,162,112,0.4); }
    .secondary-link { display: block; text-align: center; margin-top: 14px; color: #34d399; text-decoration: none; font-size: 13px; }
    .official-note { margin-top: 16px; padding: 12px 14px; background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.25); border-radius: 10px; }
    .official-note p { color: #fbbf24; font-size: 12px; line-height: 1.5; margin: 0; }
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
        <p>Referral Partner Program</p>
      </div>

      <div class="hero">
        <div class="badge">🎁 Invitation</div>
        <h2>Hi ${recipientName}, earn <span>20% commission</span> by referring startups</h2>
        <p>Refer founders, mentors and corporate teams to Startup Factory Hub. Every time someone subscribes through your unique link, you earn a one-time <strong>20% commission</strong> on the first month or year of their subscription.</p>
      </div>

      <div class="content">

        <div class="card">
          <div class="card-label">🚀 How it works (3 steps)</div>

          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <h4>Apply &amp; get approved</h4>
              <p>Open your profile and go to the <strong>Referral Program</strong> tab (or visit <a href="${REFERRAL_URL}" style="color:#34d399;text-decoration:none;">${REFERRAL_URL.replace("https://", "")}</a>) and submit a short application. Our team reviews and approves it.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <h4>Connect your Stripe payout account</h4>
              <p>Once approved, click <strong>“Connect Account”</strong> on the Referral page. You'll be redirected to <strong>Stripe Express</strong> to securely link your bank account. This step is required to receive your commissions — no Stripe = no payouts.</p>
            </div>
          </div>

          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <h4>Get your unique referral link</h4>
              <p>Your dashboard shows your personal link <code>${APP_URL.replace("https://", "")}/r/SFH-XXXXXXXX</code>. You can also create multiple labeled links for different campaigns (LinkedIn, newsletter, events…) and track conversions in real time.</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-label">💰 Commission Structure</div>
          <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin-bottom:14px;">
            Members can subscribe monthly or yearly (saving 10%). Your commission is <strong style="color:#34d399;">20% of the first payment</strong> regardless of billing cycle.
          </p>
          <table class="commission">
            <thead>
              <tr>
                <th>Plan</th>
                <th style="text-align:right;">Monthly</th>
                <th style="text-align:right;">Yearly (-10%)</th>
                <th style="text-align:right;">Commission (Monthly)</th>
                <th style="text-align:right;">Commission (Yearly)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Community</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$350.00</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$3,780.00/yr</td>
                <td class="amount" style="white-space:nowrap;">$70.00</td>
                <td class="amount" style="white-space:nowrap;">$756.00</td>
              </tr>
              <tr>
                <td>Self-Paced + Desk</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$550.00</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$5,940.00/yr</td>
                <td class="amount" style="white-space:nowrap;">$110.00</td>
                <td class="amount" style="white-space:nowrap;">$1,188.00</td>
              </tr>
              <tr>
                <td>Global Access + Office</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$950.00</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$10,260.00/yr</td>
                <td class="amount" style="white-space:nowrap;">$190.00</td>
                <td class="amount" style="white-space:nowrap;">$2,052.00</td>
              </tr>
              <tr>
                <td>Corporate</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$1,500.00</td>
                <td style="text-align:right;color:#9ca3af;white-space:nowrap;">$16,200.00/yr</td>
                <td class="amount" style="white-space:nowrap;">$300.00</td>
                <td class="amount" style="white-space:nowrap;">$3,240.00</td>
              </tr>
            </tbody>
          </table>

          <div class="official-note">
            <p>⭐ <strong>Official Mentors &amp; Advisors</strong> earn <strong>25%</strong> instead of 20% on every referral.</p>
          </div>
        </div>

        <div class="cta-section">
          <a href="${REFERRAL_URL}" class="cta-btn">Apply to the Referral Program →</a>
          <a href="${REFERRAL_URL}" class="secondary-link">Already approved? Open your referral dashboard</a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this because you're a member of Startup Factory Hub.</p>
        <p style="margin-top:6px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="${REFERRAL_URL}">Referral Program</a></p>
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
            subject:
              "Earn 20% commission — refer startups to Startup Factory Hub",
            html: html(name),
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

    console.log(`Referral invite sent: ${sent} ok, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, sent, errors, errorDetails }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-referral-invite-email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
