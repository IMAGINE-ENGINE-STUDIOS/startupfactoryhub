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
    const { to, recipientName, role } = await req.json();

    if (!to || !recipientName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const registerUrl = "https://startupfactoryhub.com/auth";
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
    <h2 style="color:#fff;font-size:20px;margin:0 0 6px;font-weight:700;">Speaker Invitation</h2>
    <p style="color:rgba(255,255,255,0.9);font-size:13px;margin:0;">Hot Deals in the Space Industry</p>
    <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:6px 0 0;">In collaboration with NASA Technology Transfer Program</p>
  </div>

  <!-- Content -->
  <div style="padding:28px 24px;background:#ffffff;">
    <p style="color:#333333;font-size:15px;line-height:1.6;margin:0 0 14px;">
      Dear <strong style="color:#0ea270;">${recipientName}</strong>,
    </p>
    <p style="color:#444444;font-size:14px;line-height:1.7;margin:0 0 20px;">
      We are honored to invite you as a <strong style="color:#222;">distinguished speaker</strong> at our exclusive
      <span style="color:#0ea270;font-weight:bold;">"Hot Deals in the Space Industry"</span> event,
      in collaboration with the <strong style="color:#222;">NASA Technology Transfer Program</strong>.
    </p>

    <!-- Your Role -->
    ${role ? `
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 10px;font-weight:bold;">YOUR ROLE</p>
      <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">
        You have been invited as <strong style="color:#222;">${role}</strong>. Your expertise and insights will be invaluable to the entrepreneurs, investors, and industry leaders attending this event.
      </p>
    </div>
    ` : ""}

    <!-- Event Details -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 12px;font-weight:bold;">EVENT DETAILS</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#666;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;width:30px;">Date</td><td style="color:#333;font-size:14px;padding:4px 0;"><strong>April 16, 2026</strong></td></tr>
        <tr><td style="color:#666;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;">Time</td><td style="color:#333;font-size:14px;padding:4px 0;"><strong>2:00 PM &ndash; 3:30 PM EST</strong></td></tr>
        <tr><td style="color:#666;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;">Access</td><td style="color:#333;font-size:14px;padding:4px 0;"><strong>Invitation Only</strong></td></tr>
        <tr><td style="color:#666;font-size:13px;padding:4px 8px 4px 0;vertical-align:top;">Format</td><td style="color:#333;font-size:14px;padding:4px 0;"><strong>Live Competition &amp; Keynotes</strong></td></tr>
      </table>
    </div>

    <!-- Event Agenda -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">EVENT AGENDA</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid rgba(14,162,112,0.15);">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:00 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Welcome &amp; Opening Remarks</strong><br><span style="color:#666;font-size:11px;">Introduction to the event and platform walkthrough</span></td>
        </tr>
        <tr style="border-bottom:1px solid rgba(14,162,112,0.15);">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">2:10 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Company Pitches Begin</strong><br><span style="color:#666;font-size:11px;">5 companies &times; 10 minutes each &mdash; presenting innovations to investors, mentors &amp; industry leaders</span></td>
        </tr>
        <tr style="border-bottom:1px solid rgba(14,162,112,0.15);">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:00 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>NASA Tech Transfer Presentation</strong><br><span style="color:#666;font-size:11px;">Meredith Reeves &mdash; NASA Technology Transfer Program</span></td>
        </tr>
        <tr style="border-bottom:1px solid rgba(14,162,112,0.15);">
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:15 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Keynote Address</strong><br><span style="color:#666;font-size:11px;">Robert S. Katz &mdash; Director, WIN (World Innovation Network)</span></td>
        </tr>
        <tr>
          <td style="color:#0ea270;font-size:12px;padding:8px 8px 8px 0;font-weight:bold;white-space:nowrap;vertical-align:top;">3:30 PM</td>
          <td style="color:#333;font-size:13px;padding:8px 0;"><strong>Winner Announcement</strong><br><span style="color:#666;font-size:11px;">Live results based on audience votes &amp; investor engagement</span></td>
        </tr>
      </table>
    </div>

    <!-- Event Dynamics -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 10px;font-weight:bold;">HOW THE EVENT WORKS</p>
      <p style="color:#444;font-size:12px;margin:0 0 12px;line-height:1.6;">
        This is a <strong style="color:#222;">live competition</strong> powered by real-time audience engagement:
      </p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Live Fire-Rating</strong> &mdash; The audience votes in real-time using our fire-rating system. The more heat a company generates, the higher they rank.</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Investor Donations</strong> &mdash; Investors and attendees can donate directly to support companies during pitches via Stripe.</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Dynamic Leaderboard</strong> &mdash; Companies are ranked live on the Race Board based on votes received. Rankings shift in real-time.</p>
      <p style="color:#444;font-size:12px;margin:4px 0;line-height:1.6;">&#9656; <strong style="color:#222;">Winner Announcement</strong> &mdash; At 3:30 PM, the company with the most votes and engagement is crowned the winner live.</p>
    </div>

    <!-- Complete Your Profile -->
    <div style="background:#f0fdf4;border:1px solid rgba(14,162,112,0.25);border-radius:12px;padding:18px;margin:0 0 18px;">
      <p style="color:#0ea270;font-size:11px;letter-spacing:2px;margin:0 0 14px;font-weight:bold;">COMPLETE YOUR PROFILE</p>
      <p style="color:#444;font-size:12px;margin:0 0 12px;line-height:1.6;">
        To ensure your speaker profile is displayed correctly during the event, please complete the following:
      </p>
      <div style="margin-bottom:14px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 1: Create Your Account</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">
          Register at <a href="${registerUrl}" style="color:#0ea270;">startupfactoryhub.com</a> and complete your profile.
        </p>
      </div>
      <div style="margin-bottom:14px;padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 2: Add Your Photo &amp; Bio</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">
          Upload a professional avatar and write a brief bio so attendees can learn about your background and expertise.
        </p>
      </div>
      <div style="padding-left:8px;border-left:2px solid rgba(14,162,112,0.3);">
        <p style="color:#0ea270;font-size:13px;margin:0 0 3px;font-weight:bold;">Step 3: Review the Event Portal</p>
        <p style="color:#444;font-size:12px;margin:0;line-height:1.5;">
          Visit the Hot Deals event portal to familiarize yourself with the platform and event layout.
        </p>
      </div>
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
        subject: `Speaker Invitation — Hot Deals in the Space Industry | April 16, 2026`,
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
