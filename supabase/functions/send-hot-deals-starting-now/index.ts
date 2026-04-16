import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, recipientName, companyName, hostLink, role } = await req.json();

    if (!to || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const portalUrl = "https://startupfactoryhub.com/hot-deals-space";
    const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";
    const isSpeaker = role === "speaker";

    const joinButton = hostLink ? `
    <div style="text-align:center;margin:24px 0;">
      <a href="${hostLink}" 
         style="display:inline-block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;padding:18px 48px;border-radius:14px;font-weight:bold;font-size:18px;letter-spacing:1.5px;box-shadow:0 6px 24px rgba(220,38,38,0.6);">
        &#128308; JOIN NOW &rarr;
      </a>
      <p style="color:#999;font-size:11px;margin:10px 0 0;">Your private ${isSpeaker ? 'speaker' : 'host'} link &mdash; do not share publicly.</p>
    </div>` : `
    <div style="text-align:center;margin:24px 0;">
      <a href="${portalUrl}" 
         style="display:inline-block;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;text-decoration:none;padding:18px 48px;border-radius:14px;font-weight:bold;font-size:18px;letter-spacing:1.5px;box-shadow:0 6px 24px rgba(220,38,38,0.6);">
        &#128308; JOIN EVENT NOW &rarr;
      </a>
    </div>`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">

<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">

  <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:32px 30px;text-align:center;">
    <img src="${logoUrl}" alt="SFH" width="60" height="60" style="display:block;margin:0 auto 12px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);" />
    <div style="display:inline-block;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.5);border-radius:20px;padding:6px 18px;margin-bottom:14px;">
      <span style="color:#fff;font-size:12px;font-weight:bold;letter-spacing:2px;">&#128308; LIVE NOW</span>
    </div>
    <h1 style="color:#fff;font-size:28px;margin:0 0 6px;font-weight:900;">EVENT IS STARTING NOW</h1>
    <p style="color:rgba(255,255,255,0.95);font-size:14px;margin:0;">Hot Deals in the Space Industry &mdash; Join Immediately!</p>
  </div>

  <div style="padding:32px 28px;background:#ffffff;">
    <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 14px;">
      Dear <strong style="color:#0ea270;">${recipientName}</strong>,
    </p>
    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 20px;">
      The <strong style="color:#0ea270;">"Hot Deals in the Space Industry"</strong> event is <strong style="color:#dc2626;">starting right now</strong>. 
      ${isSpeaker 
        ? `Please join immediately as a <strong>speaker</strong>.` 
        : `Please join immediately and be ready to present <strong>${companyName || "your company"}</strong>.`}
    </p>

    <div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:2px solid #fca5a5;border-radius:14px;padding:22px;margin:0 0 20px;text-align:center;">
      <p style="color:#dc2626;font-size:32px;font-weight:900;margin:0 0 4px;">&#128308; LIVE NOW</p>
      <p style="color:#991b1b;font-size:14px;margin:0;font-weight:600;">Click the button below to join immediately</p>
    </div>

    ${joinButton}

    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:14px;padding:20px;margin:24px 0 0;">
      <p style="color:#0ea270;font-size:12px;letter-spacing:2px;margin:0 0 12px;font-weight:bold;">QUICK REMINDERS</p>
      <p style="color:#555;font-size:13px;margin:0 0 8px;line-height:1.6;">
        &#10003; Test your audio &amp; video immediately upon joining<br>
        &#10003; ${isSpeaker ? 'Be ready when the host introduces you' : 'Have your pitch deck ready to screen-share'}<br>
        &#10003; Stay muted until called upon
      </p>
    </div>

    <div style="border-top:1px solid rgba(14,162,112,0.15);padding-top:18px;margin-top:28px;text-align:center;">
      <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.7;" />
      <p style="color:#777;font-size:11px;margin:0;">
        Powered by <strong style="color:#0ea270;">Startup Factory Hub</strong><br>
        <a href="https://startupfactoryhub.com" style="color:#0ea270;text-decoration:none;font-size:11px;">startupfactoryhub.com</a>
      </p>
    </div>
  </div>

</div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Startup Factory Hub <info@startupfactoryhub.com>",
        to: [to],
        subject: `🔴 LIVE NOW — Hot Deals Event Is Starting | Join Immediately`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
