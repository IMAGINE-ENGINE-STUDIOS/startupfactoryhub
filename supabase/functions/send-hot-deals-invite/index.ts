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
    const { to, recipientName, companyName, invitationToken } = await req.json();

    if (!to || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const registerUrl = `https://startupfactoryhub.com/auth?invite=hot-deals&token=${invitationToken || ""}`;
    const portalUrl = "https://startupfactoryhub.com/hot-deals-space";
    const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#000000;">

<div style="max-width:640px;margin:0 auto;background:linear-gradient(180deg,#0a0a0a 0%,#1a0800 30%,#0d0d0d 60%,#1a0500 100%);position:relative;">

  <div style="position:relative;background-image:url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNSIgeT0iMTUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiNmOTczMTYiIG9wYWNpdHk9IjAuMDciPjAxPC90ZXh0Pjx0ZXh0IHg9IjIwIiB5PSIzNSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2Y5NzMxNiIgb3BhY2l0eT0iMC4wNSI+MTA8L3RleHQ+PC9zdmc+');border:1px solid rgba(249,115,22,0.3);border-radius:16px;overflow:hidden;">

    <!-- Header with logo -->
    <div style="background:linear-gradient(135deg,#f97316 0%,#ea580c 50%,#c2410c 100%);padding:36px 30px 32px;text-align:center;">
      <img src="${logoUrl}" alt="Startup Factory Hub" width="70" height="70" style="display:block;margin:0 auto 14px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);" />
      <h1 style="color:#fff;font-size:22px;margin:0 0 4px;font-weight:800;letter-spacing:0.5px;">STARTUP FACTORY HUB</h1>
      <div style="width:60px;height:2px;background:rgba(255,255,255,0.5);margin:8px auto 12px;border-radius:2px;"></div>
      <div style="font-size:14px;color:#fff;font-weight:700;margin-bottom:10px;letter-spacing:2px;">HOT DEALS</div>
      <h2 style="color:#fff;font-size:20px;margin:0 0 6px;font-weight:700;">You're Invited to Pitch!</h2>
      <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:0;">Hot Deals in the Space Industry</p>
      <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:6px 0 0;">In collaboration with NASA Technology Transfer Program</p>
    </div>

    <!-- Content area -->
    <div style="padding:28px 24px;">
      <p style="color:#e5e5e5;font-size:15px;line-height:1.6;margin:0 0 14px;">
        Dear <strong style="color:#fb923c;">${recipientName}</strong>,
      </p>
      <p style="color:#d4d4d4;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Congratulations! <strong style="color:#fff;">${companyName || "Your company"}</strong> has been selected to participate in our exclusive 
        <span style="color:#f97316;font-weight:bold;">"Hot Deals in the Space Industry"</span> event, 
        in collaboration with the <strong style="color:#fff;">NASA Technology Transfer Program</strong>.
      </p>

      <!-- Event Details -->
      <div style="background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
        <p style="color:#f97316;font-size:11px;letter-spacing:2px;margin:0 0 12px;font-weight:bold;">EVENT DETAILS</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#9ca3af;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;width:30px;">Date</td><td style="color:#e5e5e5;font-size:14px;padding:4px 0;"><strong>April 16, 2026</strong></td></tr>
          <tr><td style="color:#9ca3af;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;">Time</td><td style="color:#e5e5e5;font-size:14px;padding:4px 0;"><strong>2:00 PM &ndash; 3:30 PM EST</strong></td></tr>
          <tr><td style="color:#9ca3af;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;">Access</td><td style="color:#e5e5e5;font-size:14px;padding:4px 0;"><strong>Invitation Only &mdash; Be Prepared to Pitch!</strong></td></tr>
          <tr><td style="color:#9ca3af;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;">Format</td><td style="color:#e5e5e5;font-size:14px;padding:4px 0;"><strong>10-minute pitch per company</strong></td></tr>
        </table>
      </div>

      <!-- Full Agenda -->
      <div style="background:rgba(249,115,22,0.04);border:1px solid rgba(249,115,22,0.35);border-radius:12px;padding:18px;margin:0 0 18px;">
        <p style="color:#f97316;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">&#128197; EVENT AGENDA</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid rgba(249,115,22,0.15);">
            <td style="color:#fb923c;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:00 PM</td>
            <td style="color:#e5e5e5;font-size:13px;padding:8px 0;"><strong>Welcome &amp; Opening Remarks</strong><br><span style="color:#9ca3af;font-size:11px;">Introduction to the event and platform walkthrough</span></td>
          </tr>
          <tr style="border-bottom:1px solid rgba(249,115,22,0.15);">
            <td style="color:#fb923c;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:10 PM</td>
            <td style="color:#e5e5e5;font-size:13px;padding:8px 0;"><strong>Company Pitches Begin</strong><br><span style="color:#9ca3af;font-size:11px;">5 companies &times; 10 minutes each &mdash; present your innovation to investors, mentors &amp; industry leaders</span></td>
          </tr>
          <tr style="border-bottom:1px solid rgba(249,115,22,0.15);">
            <td style="color:#fb923c;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:00 PM</td>
            <td style="color:#e5e5e5;font-size:13px;padding:8px 0;"><strong>NASA Tech Transfer Presentation</strong><br><span style="color:#9ca3af;font-size:11px;">Meredith Reeves &mdash; NASA Technology Transfer Program</span></td>
          </tr>
          <tr style="border-bottom:1px solid rgba(249,115,22,0.15);">
            <td style="color:#fb923c;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:15 PM</td>
            <td style="color:#e5e5e5;font-size:13px;padding:8px 0;"><strong>Keynote Address</strong><br><span style="color:#9ca3af;font-size:11px;">Robert S. Katz &mdash; Director, WIN (Washington Innovation Network)</span></td>
          </tr>
          <tr>
            <td style="color:#fb923c;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:30 PM</td>
            <td style="color:#e5e5e5;font-size:13px;padding:8px 0;"><strong>&#127942; Winner Announcement</strong><br><span style="color:#9ca3af;font-size:11px;">Live results based on audience votes &amp; investor engagement</span></td>
          </tr>
        </table>
      </div>

      <!-- What You'll Be Doing -->
      <div style="background:rgba(249,115,22,0.04);border:1px solid rgba(249,115,22,0.35);border-radius:12px;padding:18px;margin:0 0 18px;">
        <p style="color:#f97316;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">&#127908; WHAT TO SPEAK ABOUT</p>
        <p style="color:#d4d4d4;font-size:12px;margin:0 0 10px;line-height:1.6;">
          During your <strong style="color:#fff;">10-minute pitch</strong>, you should cover:
        </p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#8226; <strong style="color:#fff;">The problem</strong> your company solves in the space industry</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#8226; <strong style="color:#fff;">Your solution</strong> &mdash; how your technology or service works</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#8226; <strong style="color:#fff;">Market opportunity</strong> &mdash; size, traction, and competitive edge</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#8226; <strong style="color:#fff;">Business model</strong> &mdash; how you make money</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#8226; <strong style="color:#fff;">Team</strong> &mdash; who&rsquo;s behind the company</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#8226; <strong style="color:#fff;">The ask</strong> &mdash; what you need (funding, partnerships, resources)</p>
      </div>

      <!-- Event Dynamics -->
      <div style="background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:18px;margin:0 0 18px;">
        <p style="color:#f97316;font-size:11px;letter-spacing:2px;margin:0 0 10px;font-weight:bold;">&#128293; HOW THE EVENT WORKS</p>
        <p style="color:#d4d4d4;font-size:12px;margin:0 0 12px;line-height:1.6;">
          This is a <strong style="color:#fff;">live competition</strong> powered by real-time audience engagement. Here&rsquo;s how the dynamics work:
        </p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#128293; <strong style="color:#fff;">Live Fire-Rating</strong> &mdash; The audience votes in real-time using our fire-rating system. The more heat you generate, the higher you rank.</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#128176; <strong style="color:#fff;">Investor Donations</strong> &mdash; Investors and attendees can donate directly to support your company during your pitch via Stripe. This is why connecting your Stripe account is essential.</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#128200; <strong style="color:#fff;">Dynamic Leaderboard</strong> &mdash; Companies are ranked live on the Race Board based on votes received. Rankings shift in real-time as the audience reacts.</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#127942; <strong style="color:#fff;">Winner Announcement</strong> &mdash; At 3:30 PM, the company with the most votes and engagement is crowned the winner live on stage.</p>
        <p style="color:#d4d4d4;font-size:12px;margin:4px 0;line-height:1.6;">&#128196; <strong style="color:#fff;">Pitch Deck Display</strong> &mdash; Your uploaded pitch deck will be visible to all attendees and investors on the event portal throughout the event.</p>
      </div>

      <!-- Steps to Get Ready -->
      <div style="background:rgba(249,115,22,0.04);border:1px solid rgba(249,115,22,0.35);border-radius:12px;padding:18px;margin:0 0 18px;">
        <p style="color:#f97316;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">&#9989; HOW TO GET READY</p>
        
        <div style="margin-bottom:14px;padding-left:8px;border-left:2px solid rgba(249,115,22,0.3);">
          <p style="color:#fb923c;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 1: Create Your Account</p>
          <p style="color:#d4d4d4;font-size:12px;margin:0;line-height:1.5;">
            Register at <a href="${registerUrl}" style="color:#f97316;">startupfactoryhub.com</a> &mdash; complete your profile with your name, avatar, company details (description, industry, location, website), and upload your pitch deck.
          </p>
        </div>

        <div style="margin-bottom:14px;padding-left:8px;border-left:2px solid rgba(249,115,22,0.3);">
          <p style="color:#fb923c;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 2: Connect Stripe</p>
          <p style="color:#d4d4d4;font-size:12px;margin:0;line-height:1.5;">
            Go to your Dashboard &rarr; Payout Account and connect your Stripe account. This allows you to receive donations and support from investors during and after the event.
          </p>
        </div>

        <div style="margin-bottom:14px;padding-left:8px;border-left:2px solid rgba(249,115,22,0.3);">
          <p style="color:#fb923c;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 3: Prepare Your 10-Minute Pitch</p>
          <p style="color:#d4d4d4;font-size:12px;margin:0;line-height:1.5;">
            Cover your problem, solution, market, business model, team, and ask. Practice makes perfect!
          </p>
        </div>

        <div style="padding-left:8px;border-left:2px solid rgba(249,115,22,0.3);">
          <p style="color:#fb923c;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 4: Upload Your Pitch Deck</p>
          <p style="color:#d4d4d4;font-size:12px;margin:0;line-height:1.5;">
            Upload your pitch deck to your company profile. It will be displayed on the event portal for investors and the audience to review.
          </p>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${registerUrl}" 
           style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:14px;letter-spacing:1px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">
          CREATE YOUR ACCOUNT &rarr;
        </a>
        <br><br>
        <a href="${portalUrl}" 
           style="display:inline-block;background:transparent;color:#f97316;text-decoration:none;padding:11px 28px;border-radius:12px;font-weight:bold;font-size:12px;letter-spacing:1px;border:1px solid rgba(249,115,22,0.5);">
          VIEW EVENT PORTAL
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid rgba(249,115,22,0.15);padding-top:18px;margin-top:24px;text-align:center;">
        <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.7;" />
        <p style="color:#777;font-size:11px;margin:0;">
          Powered by <strong style="color:#fb923c;">Startup Factory Hub</strong><br>
          <a href="https://startupfactoryhub.com" style="color:#f97316;text-decoration:none;font-size:11px;">startupfactoryhub.com</a>
        </p>
        <p style="color:#555;font-size:10px;margin:8px 0 0;">&copy; 2026 Startup Factory Hub &middot; All rights reserved</p>
      </div>
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
        subject: "You're Invited to Pitch — Hot Deals in the Space Industry | April 16, 2026",
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