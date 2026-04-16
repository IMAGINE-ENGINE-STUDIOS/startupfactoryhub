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
    const { to, recipientName, companyName } = await req.json();

    if (!to || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const registerUrl = "https://startupfactoryhub.com/auth?invite=hot-deals";
    const portalUrl = "https://startupfactoryhub.com/hot-deals-space";
    const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">

<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(14,162,112,0.2);border-radius:16px;overflow:hidden;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0ea270 0%,#059669 50%,#047857 100%);padding:36px 30px 32px;text-align:center;">
    <img src="${logoUrl}" alt="Startup Factory Hub" width="70" height="70" style="display:block;margin:0 auto 14px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);" />
    <h1 style="color:#fff;font-size:22px;margin:0 0 4px;font-weight:800;letter-spacing:0.5px;">STARTUP FACTORY HUB</h1>
    <div style="width:60px;height:2px;background:rgba(255,255,255,0.5);margin:8px auto 12px;border-radius:2px;"></div>
    <div style="font-size:14px;color:#fff;font-weight:700;margin-bottom:10px;letter-spacing:2px;">&#9670; HOT DEALS &#9670;</div>
    <h2 style="color:#fff;font-size:20px;margin:0 0 6px;font-weight:700;">Participant Notes &mdash; Pitch Day</h2>
    <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:0;">Important Instructions for Your Pitch</p>
  </div>

  <!-- Content area -->
  <div style="padding:28px 24px;background:#ffffff;">
    <p style="color:#333333;font-size:15px;line-height:1.6;margin:0 0 14px;">
      Dear <strong style="color:#0ea270;">${recipientName}</strong>,
    </p>
    <p style="color:#444444;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Thank you for participating in the <span style="color:#0ea270;font-weight:bold;">"Hot Deals in the Space Industry"</span> event representing <strong style="color:#222;">${companyName || "your company"}</strong>. Below are important notes to help you prepare for your pitch.
    </p>

    <!-- Event Time Banner -->
    <div style="background:linear-gradient(135deg,#0ea270,#059669);border-radius:12px;padding:16px 18px;margin:0 0 20px;text-align:center;">
      <p style="color:#fff;font-size:16px;font-weight:bold;margin:0 0 4px;">&#9200; Event Day &mdash; Wednesday, April 16th</p>
      <p style="color:rgba(255,255,255,0.9);font-size:12px;margin:0;">2:00 PM &ndash; 3:10 PM EST &middot; Invitation Only</p>
    </div>

    <!-- Participant Notes -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">PARTICIPANT NOTES</p>

      <div style="margin-bottom:14px;padding:14px;background:#ffffff;border-radius:8px;border-left:3px solid #0ea270;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 6px;">&#9200; You Have Up to 10 Minutes</p>
        <p style="color:#444;font-size:13px;margin:0;line-height:1.6;">
          Each startup is allocated <strong>up to 10 minutes</strong> to pitch. Use this time wisely to present your vision, traction, and ask.
        </p>
      </div>

      <div style="margin-bottom:14px;padding:14px;background:#ffffff;border-radius:8px;border-left:3px solid #0ea270;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 6px;">&#128172; Moderator Follow-Up</p>
        <p style="color:#444;font-size:13px;margin:0;line-height:1.6;">
          If your presentation is shorter than 10 minutes, the moderator may ask <strong>follow-up questions</strong> about why your solution is important right now, or open the floor for audience questions.
        </p>
      </div>

      <div style="padding:14px;background:#ffffff;border-radius:8px;border-left:3px solid #0ea270;">
        <p style="color:#222;font-size:14px;font-weight:bold;margin:0 0 6px;">&#9989; Come Prepared</p>
        <p style="color:#444;font-size:13px;margin:0;line-height:1.6;">
          Make sure your pitch deck is uploaded, your Stripe payout account is connected, and you are ready to present confidently. <strong>First impressions matter.</strong>
        </p>
      </div>
    </div>

    <!-- Pitch Preparation Checklist -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">PITCH PREPARATION CHECKLIST SUGGESTIONS</p>

      <div style="margin-bottom:10px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 2px;font-weight:bold;">&#9744; The Problem</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">Clearly define the problem you are solving and why it matters now.</p>
      </div>

      <div style="margin-bottom:10px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 2px;font-weight:bold;">&#9744; Your Solution</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">Explain how your product or service solves the problem uniquely.</p>
      </div>

      <div style="margin-bottom:10px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 2px;font-weight:bold;">&#9744; Market Opportunity</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">Show the size and potential of the market you are targeting.</p>
      </div>

      <div style="margin-bottom:10px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 2px;font-weight:bold;">&#9744; Business Model</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">How do you make money? Revenue streams, pricing, unit economics.</p>
      </div>

      <div style="margin-bottom:10px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 2px;font-weight:bold;">&#9744; Your Team</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">Highlight key team members and why your team is the right one to execute.</p>
      </div>

      <div style="padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 2px;font-weight:bold;">&#9744; The Ask</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">Be specific about what you need &mdash; funding amount, partnerships, resources.</p>
      </div>
    </div>

    <!-- How the Event Works -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 10px;font-weight:bold;">HOW THE EVENT WORKS</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Live Fire-Rating</strong> &mdash; The audience votes in real-time. The more heat you generate, the higher you rank.</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Investor Donations</strong> &mdash; Investors can donate directly during your pitch via Stripe.</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Dynamic Leaderboard</strong> &mdash; Companies are ranked live based on votes received.</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Winner Announcement</strong> &mdash; At 3:10 PM, the top company is crowned live.</p>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align:center;margin:24px 0;">
      <a href="${registerUrl}" 
         style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:14px;letter-spacing:1px;box-shadow:0 4px 16px rgba(14,162,112,0.4);">
        COMPLETE YOUR PROFILE &rarr;
      </a>
      <br><br>
      <a href="${portalUrl}" 
         style="display:inline-block;background:transparent;color:#0ea270;text-decoration:none;padding:11px 28px;border-radius:12px;font-weight:bold;font-size:12px;letter-spacing:1px;border:1px solid rgba(14,162,112,0.5);">
        VIEW EVENT PORTAL
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(14,162,112,0.15);padding-top:18px;margin-top:24px;text-align:center;">
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
        subject: `Participant Notes — Hot Deals Pitch Day | ${companyName || "Your Company"}`,
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
