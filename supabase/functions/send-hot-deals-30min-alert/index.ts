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
    const { to, recipientName, companyName, hostLink } = await req.json();

    if (!to || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const portalUrl = "https://startupfactoryhub.com/hot-deals-space";
    const logoUrl = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const hostLinkButton = hostLink ? `
    <div style="text-align:center;margin:20px 0;">
      <a href="${hostLink}" 
         style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#fff;text-decoration:none;padding:16px 40px;border-radius:14px;font-weight:bold;font-size:16px;letter-spacing:1.5px;box-shadow:0 6px 20px rgba(212,175,55,0.5);">
        &#128279; JOIN AS HOST &rarr;
      </a>
      <p style="color:#999;font-size:11px;margin:8px 0 0;">This is your private host link &mdash; do not share it publicly.</p>
    </div>` : '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">

<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(14,162,112,0.2);border-radius:16px;overflow:hidden;">

  <!-- URGENT HEADER -->
  <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 50%,#991b1b 100%);padding:28px 30px 24px;text-align:center;">
    <img src="${logoUrl}" alt="Startup Factory Hub" width="60" height="60" style="display:block;margin:0 auto 12px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);" />
    <div style="display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);border-radius:20px;padding:4px 16px;margin-bottom:12px;">
      <span style="color:#fff;font-size:12px;font-weight:bold;letter-spacing:2px;">&#9888; URGENT &mdash; 30 MINUTES</span>
    </div>
    <h1 style="color:#fff;font-size:24px;margin:0 0 4px;font-weight:800;">EVENT STARTS IN 30 MINUTES</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:0;">Hot Deals in the Space Industry &mdash; Get Ready Now!</p>
  </div>

  <!-- Content -->
  <div style="padding:28px 24px;background:#ffffff;">
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 14px;">
      Dear <strong style="color:#0ea270;">${recipientName}</strong>,
    </p>
    <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 20px;">
      The <strong style="color:#0ea270;">"Hot Deals in the Space Industry"</strong> event starts in <strong style="color:#dc2626;">30 minutes</strong>. 
      Please be ready with your presentation for <strong>${companyName || "your company"}</strong>.
    </p>

    <!-- COUNTDOWN BOX -->
    <div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:2px solid #fca5a5;border-radius:14px;padding:20px;margin:0 0 20px;text-align:center;">
      <p style="color:#dc2626;font-size:28px;font-weight:900;margin:0 0 4px;">&#9200; 30 MINUTES</p>
      <p style="color:#991b1b;font-size:13px;margin:0;font-weight:600;">2:00 PM &ndash; 3:10 PM EST &middot; Today, April 16th</p>
    </div>

    ${hostLinkButton}

    <!-- HOST INSTRUCTIONS -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:14px;padding:20px;margin:0 0 20px;">
      <p style="color:#0ea270;font-size:12px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">&#127775; HOST INSTRUCTIONS</p>
      
      <div style="margin-bottom:14px;padding:12px 14px;background:#fff;border-radius:10px;border-left:3px solid #0ea270;">
        <p style="color:#0ea270;font-size:13px;margin:0 0 4px;font-weight:bold;">Join Using Your Host Link</p>
        <p style="color:#555;font-size:12px;margin:0;line-height:1.5;">
          As a <strong>HOST</strong>, you will have permission to accept people into the session, mute/unmute participants, and share your screen.
        </p>
      </div>

      <div style="margin-bottom:14px;padding:12px 14px;background:#fff;border-radius:10px;border-left:3px solid #0ea270;">
        <p style="color:#0ea270;font-size:13px;margin:0 0 4px;font-weight:bold;">Be Ready to Present</p>
        <p style="color:#555;font-size:12px;margin:0;line-height:1.5;">
          Once the event host calls <strong>${companyName || "your company"}</strong>, you need to <strong>immediately start your presentation</strong>. Have your pitch deck and screen share ready.
        </p>
      </div>

      <div style="margin-bottom:14px;padding:12px 14px;background:#fff;border-radius:10px;border-left:3px solid #0ea270;">
        <p style="color:#0ea270;font-size:13px;margin:0 0 4px;font-weight:bold;">Your Host Permissions</p>
        <p style="color:#555;font-size:12px;margin:0;line-height:1.5;">
          &#10003; Accept/reject participants joining the session<br>
          &#10003; Mute and unmute other participants<br>
          &#10003; Share your screen for your pitch deck<br>
          &#10003; Control who can speak during your slot
        </p>
      </div>

      <div style="padding:12px 14px;background:#fff;border-radius:10px;border-left:3px solid #D4AF37;">
        <p style="color:#B8860B;font-size:13px;margin:0 0 4px;font-weight:bold;">&#128161; Pro Tip</p>
        <p style="color:#555;font-size:12px;margin:0;line-height:1.5;">
          Join 5&ndash;10 minutes early to test your audio, video, and screen sharing. Make sure your pitch deck is loaded and ready to go.
        </p>
      </div>
    </div>

    <!-- AGENDA REMINDER -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:0 0 20px;">
      <p style="color:#0ea270;font-size:12px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">EVENT AGENDA &mdash; APRIL 16, 2026</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:00 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;">Welcome &amp; Introduction</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:10 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>NuView</strong> &mdash; Startup Pitch</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:20 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Arachnid System</strong> &mdash; Startup Pitch</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:30 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Fibonacci Cellars</strong> &mdash; Startup Pitch</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:40 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;">NASA Tech Transfer Presentation</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:55 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;">Robert Katz &mdash; Keynote Speaker</td>
        </tr>
        <tr>
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:10 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Winner Announcement</strong></td>
        </tr>
      </table>
    </div>

    <!-- PORTAL LINK -->
    <div style="text-align:center;margin:24px 0;">
      <a href="${portalUrl}" 
         style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:14px;letter-spacing:1px;box-shadow:0 4px 16px rgba(14,162,112,0.4);">
        VIEW EVENT PORTAL &rarr;
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
        subject: `⚠️ 30 MINUTES — Hot Deals Event Starting Soon | Be Ready!`,
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
