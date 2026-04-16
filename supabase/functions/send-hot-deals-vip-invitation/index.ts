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
    const { to, recipientName, personalMessage } = await req.json();

    if (!to || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, recipientName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const portalUrl = "https://startupfactoryhub.com/hot-deals-space";
    const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const personalMessageBlock = personalMessage
      ? `<div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:18px;margin:0 0 20px;">
           <p style="color:#D4AF37;font-size:11px;letter-spacing:2px;margin:0 0 10px;font-weight:bold;">PERSONAL MESSAGE</p>
           <p style="color:#444;font-size:14px;line-height:1.7;margin:0;font-style:italic;">"${personalMessage}"</p>
         </div>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">

<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(212,175,55,0.3);border-radius:16px;overflow:hidden;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0ea270 0%,#047857 40%,#1a1a2e 100%);padding:40px 30px 36px;text-align:center;position:relative;">
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#D4AF37,#F5D060,#D4AF37);"></div>
    <img src="${logoUrl}" alt="Startup Factory Hub" width="74" height="74" style="display:block;margin:0 auto 14px;border-radius:14px;border:2px solid rgba(212,175,55,0.5);" />
    <h1 style="color:#fff;font-size:22px;margin:0 0 4px;font-weight:800;letter-spacing:0.5px;">STARTUP FACTORY HUB</h1>
    <div style="width:60px;height:2px;background:linear-gradient(90deg,#D4AF37,#F5D060);margin:10px auto 14px;border-radius:2px;"></div>
    <div style="display:inline-block;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);padding:8px 22px;border-radius:50px;margin-bottom:14px;">
      <span style="color:#F5D060;font-size:12px;font-weight:800;letter-spacing:2px;">EXCLUSIVE VIP INVITATION</span>
    </div>
    <h2 style="color:#fff;font-size:20px;margin:0 0 6px;font-weight:700;">Hot Deals in the Space Industry</h2>
    <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;">You've Been Personally Invited</p>
  </div>

  <!-- Content -->
  <div style="padding:28px 24px;background:#ffffff;">
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 14px;">
      Dear <strong style="color:#D4AF37;">${recipientName}</strong>,
    </p>
    <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 20px;">
      You have been personally selected to attend an exclusive live event featuring the most promising startups in the space industry. This is an <strong>invitation-only</strong> experience reserved for distinguished guests, investors, and industry leaders.
    </p>

    <!-- Event Details Banner -->
    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="color:#F5D060;font-size:11px;letter-spacing:2px;margin:0 0 10px;font-weight:bold;">EVENT DETAILS</p>
      <p style="color:#fff;font-size:18px;font-weight:bold;margin:0 0 6px;">Wednesday, April 16th, 2026</p>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0 0 12px;">2:00 PM &ndash; 3:10 PM EST</p>
      <div style="width:40px;height:1px;background:rgba(212,175,55,0.4);margin:0 auto 12px;"></div>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0;">In collaboration with <strong style="color:#F5D060;">NASA Technology Transfer Program</strong></p>
    </div>

    <!-- What to Expect -->
    <div style="background:#fefdf5;border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#D4AF37;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">WHAT TO EXPECT</p>

      <div style="margin-bottom:12px;padding:12px;background:#ffffff;border-radius:8px;border-left:3px solid #D4AF37;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 4px;">Live Startup Pitches</p>
        <p style="color:#555;font-size:13px;margin:0;line-height:1.5;">Watch curated startups pitch their groundbreaking solutions in the space industry, live and unfiltered.</p>
      </div>

      <div style="margin-bottom:12px;padding:12px;background:#ffffff;border-radius:8px;border-left:3px solid #D4AF37;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 4px;">Real-Time Audience Voting</p>
        <p style="color:#555;font-size:13px;margin:0;line-height:1.5;">Cast your vote and influence which startup earns the top spot on the live leaderboard.</p>
      </div>

      <div style="margin-bottom:12px;padding:12px;background:#ffffff;border-radius:8px;border-left:3px solid #D4AF37;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 4px;">Direct Investment Opportunity</p>
        <p style="color:#555;font-size:13px;margin:0;line-height:1.5;">Support promising startups with direct donations via Stripe during the live event.</p>
      </div>

      <div style="padding:12px;background:#ffffff;border-radius:8px;border-left:3px solid #D4AF37;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 4px;">NASA AR Experience</p>
        <p style="color:#555;font-size:13px;margin:0;line-height:1.5;">Explore interactive NASA Augmented Reality 3D models integrated into the event portal.</p>
      </div>
    </div>

    ${personalMessageBlock}

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="${portalUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#fff;text-decoration:none;padding:16px 44px;border-radius:12px;font-weight:bold;font-size:15px;letter-spacing:1px;box-shadow:0 6px 20px rgba(212,175,55,0.4);">
        ENTER THE PORTAL &rarr;
      </a>
    </div>

    <p style="color:#888;font-size:12px;text-align:center;margin:0 0 24px;">
      This is an invitation-only event. Your access is confirmed upon entering the portal.
    </p>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(212,175,55,0.2);padding-top:18px;margin-top:24px;text-align:center;">
      <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.7;" />
      <p style="color:#777;font-size:11px;margin:0;">
        Powered by <strong style="color:#0ea270;">Startup Factory Hub</strong><br>
        <a href="https://startupfactoryhub.com" style="color:#0ea270;text-decoration:none;font-size:11px;">startupfactoryhub.com</a>
      </p>
      <p style="color:#999;font-size:10px;margin:8px 0 0;">&copy; 2026 Startup Factory Hub &middot; All rights reserved</p>
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
        subject: `Exclusive VIP Invitation — Hot Deals in the Space Industry`,
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
