import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, recipientName, companyName, promoCode } = await req.json();
    if (!to || !promoCode) {
      return new Response(JSON.stringify({ error: "to and promoCode required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://startupfactoryhub.com";
    const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";
    const videoUrl = `${siteUrl}/hot-deals-winner-video.mp4`;
    const posterUrl = `${siteUrl}/hot-deals-winner-poster.jpg`;
    const claimUrl = `${siteUrl}/membership?plan=community&billing=yearly&promo=${encodeURIComponent(promoCode)}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#0a0a0a;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">

  <div style="background:linear-gradient(135deg,#dc2626 0%,#ea580c 50%,#facc15 100%);padding:40px 30px;text-align:center;">
    <img src="${logoUrl}" alt="SFH" width="60" height="60" style="display:block;margin:0 auto 16px;border-radius:14px;border:2px solid rgba(255,255,255,0.4);" />
    <div style="display:inline-block;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.5);border-radius:20px;padding:6px 18px;margin-bottom:14px;">
      <span style="color:#fff;font-size:11px;font-weight:bold;letter-spacing:3px;">RACE WINNER</span>
    </div>
    <h1 style="color:#fff;font-size:32px;margin:0 0 8px;font-weight:900;letter-spacing:-0.5px;">YOU WON!</h1>
    <p style="color:rgba(255,255,255,0.95);font-size:15px;margin:0;font-weight:600;">Hot Deals in the Space Industry &mdash; Champion</p>
  </div>

  <div style="padding:32px 28px;background:#ffffff;">

    <a href="${siteUrl}/hot-deals-space" style="display:block;text-decoration:none;margin:0 0 28px;">
      <div style="position:relative;border-radius:14px;overflow:hidden;border:2px solid #facc15;box-shadow:0 8px 24px rgba(220,38,38,0.25);">
        <video src="${videoUrl}" poster="${posterUrl}" autoplay loop muted playsinline width="100%" style="display:block;width:100%;height:auto;background:#000;"></video>
        <img src="${posterUrl}" alt="Winner celebration" width="100%" style="display:none;width:100%;height:auto;" />
      </div>
    </a>

    <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
      Dear <strong style="color:#dc2626;">${recipientName || "Champion"}</strong>,
    </p>
    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Congratulations! <strong style="color:#dc2626;">${companyName || "Your startup"}</strong> has been crowned the winner of the 
      <strong>Hot Deals in the Space Industry</strong> race. Your pitch, your vision, your execution &mdash; the community voted, and you won.
    </p>

    <div style="background:linear-gradient(135deg,#fef2f2,#fffbeb);border:2px solid #facc15;border-radius:14px;padding:24px;margin:0 0 24px;text-align:center;">
      <p style="color:#92400e;font-size:11px;letter-spacing:3px;margin:0 0 8px;font-weight:bold;">YOUR PRIZE</p>
      <h2 style="color:#dc2626;font-size:24px;margin:0 0 12px;font-weight:900;">1 Year Community Membership</h2>
      <p style="color:#444;font-size:14px;margin:0 0 16px;line-height:1.6;">
        + <strong style="color:#0ea270;">Earth Intelligence access</strong> bundled free
      </p>
      <div style="display:inline-block;background:#fff;border-radius:10px;padding:14px 24px;border:1px solid rgba(220,38,38,0.2);">
        <span style="color:#999;font-size:13px;text-decoration:line-through;margin-right:10px;">$5,940/yr</span>
        <span style="color:#0ea270;font-size:20px;font-weight:900;">FREE for 1 Year</span>
      </div>
    </div>

    <div style="background:#0a0a0a;border:2px solid #facc15;border-radius:14px;padding:24px;margin:0 0 24px;text-align:center;box-shadow:0 0 30px rgba(250,204,21,0.25);">
      <p style="color:#facc15;font-size:11px;letter-spacing:3px;margin:0 0 12px;font-weight:bold;">YOUR EXCLUSIVE CODE</p>
      <div style="background:#1a1a1a;border:1px dashed rgba(250,204,21,0.5);border-radius:10px;padding:18px;margin:0 0 12px;">
        <code style="color:#facc15;font-family:'Courier New',monospace;font-size:24px;font-weight:bold;letter-spacing:2px;">${promoCode}</code>
      </div>
      <p style="color:#999;font-size:12px;margin:0;">Single-use &middot; 100% off &middot; Community yearly plan</p>
    </div>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${claimUrl}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff;text-decoration:none;padding:18px 48px;border-radius:14px;font-weight:bold;font-size:17px;letter-spacing:1px;box-shadow:0 6px 24px rgba(220,38,38,0.5);">
        CLAIM YOUR FREE YEAR &rarr;
      </a>
      <p style="color:#999;font-size:11px;margin:10px 0 0;">Code applies automatically at checkout.</p>
    </div>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 12px;font-weight:bold;">HOW TO REDEEM</p>
      <p style="color:#555;font-size:13px;margin:0;line-height:1.8;">
        1. Click the button above (or visit <a href="${siteUrl}/membership" style="color:#0ea270;">${siteUrl}/membership</a>)<br>
        2. Sign in with this email address<br>
        3. Select <strong>Community &mdash; Yearly</strong><br>
        4. Code <strong>${promoCode}</strong> applies at checkout &mdash; total: <strong style="color:#0ea270;">$0.00</strong><br>
        5. Earth Intelligence access activates automatically
      </p>
    </div>

    <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;">
      <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.7;" />
      <p style="color:#777;font-size:11px;margin:0;line-height:1.6;">
        Powered by <strong style="color:#0ea270;">Startup Factory Hub</strong><br>
        <a href="${siteUrl}" style="color:#0ea270;text-decoration:none;">startupfactoryhub.com</a>
      </p>
    </div>
  </div>
</div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Startup Factory Hub <info@startupfactoryhub.com>",
        to: [to],
        subject: `🏆 You Won! Claim your 1 Year FREE Community Membership ($5,940 value)`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
