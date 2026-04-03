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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #f97316;border-radius:16px;overflow:hidden;">
  
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:40px 30px;text-align:center;">
    <div style="font-size:48px;margin-bottom:16px;">🔥</div>
    <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">You're Invited to Pitch!</h1>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">Hot Deals in the Space Industry</p>
    <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:8px 0 0;">In collaboration with NASA Technology Transfer Program</p>
  </div>

  <div style="padding:30px;">
    <p style="color:#e5e5e5;font-size:15px;line-height:1.6;">
      Dear <strong>${recipientName}</strong>,
    </p>
    <p style="color:#e5e5e5;font-size:15px;line-height:1.6;">
      Congratulations! <strong>${companyName || "Your startup"}</strong> has been selected to participate in our exclusive 
      <span style="color:#f97316;font-weight:bold;">"Hot Deals in the Space Industry"</span> event, 
      in collaboration with the <strong>NASA Technology Transfer Program</strong>.
    </p>

    <!-- Event Details -->
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="color:#f97316;font-size:12px;letter-spacing:2px;margin:0 0 12px;font-weight:bold;">EVENT DETAILS</p>
      <p style="color:#e5e5e5;font-size:14px;margin:4px 0;">📅 <strong>April 16, 2026</strong></p>
      <p style="color:#e5e5e5;font-size:14px;margin:4px 0;">🕑 <strong>2:00 PM – 3:30 PM EST</strong></p>
      <p style="color:#e5e5e5;font-size:14px;margin:4px 0;">🎯 <strong>Invitation Only — Be Prepared to Pitch!</strong></p>
      <p style="color:#e5e5e5;font-size:14px;margin:4px 0;">⏱️ <strong>5-minute pitch per startup</strong></p>
    </div>

    <!-- Steps to Get Ready -->
    <div style="background:#1a1a1a;border:1px solid #f97316;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="color:#f97316;font-size:12px;letter-spacing:2px;margin:0 0 16px;font-weight:bold;">🚀 HOW TO GET READY</p>
      
      <div style="margin-bottom:16px;">
        <p style="color:#f97316;font-size:14px;margin:0 0 4px;font-weight:bold;">Step 1: Create Your Account</p>
        <p style="color:#e5e5e5;font-size:13px;margin:0;line-height:1.5;">
          Register at <a href="${registerUrl}" style="color:#f97316;">startupfactoryhub.com</a> — complete your profile with your name, avatar, company details (description, industry, location, website), and upload your pitch deck.
        </p>
      </div>

      <div style="margin-bottom:16px;">
        <p style="color:#f97316;font-size:14px;margin:0 0 4px;font-weight:bold;">Step 2: Connect Stripe</p>
        <p style="color:#e5e5e5;font-size:13px;margin:0;line-height:1.5;">
          Go to your Dashboard → Payout Account and connect your Stripe account. This allows you to receive donations and support from investors during and after the event.
        </p>
      </div>

      <div style="margin-bottom:16px;">
        <p style="color:#f97316;font-size:14px;margin:0 0 4px;font-weight:bold;">Step 3: Prepare Your 5-Minute Pitch</p>
        <p style="color:#e5e5e5;font-size:13px;margin:0;line-height:1.5;">
          You'll have exactly 5 minutes to present your space-tech innovation to investors, mentors, and industry leaders. Practice makes perfect!
        </p>
      </div>

      <div>
        <p style="color:#f97316;font-size:14px;margin:0 0 4px;font-weight:bold;">Step 4: Upload Your Pitch Deck</p>
        <p style="color:#e5e5e5;font-size:13px;margin:0;line-height:1.5;">
          Upload your pitch deck to your company profile. It will be displayed on the event portal for investors and the audience to review.
        </p>
      </div>
    </div>

    <!-- What to Expect -->
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="color:#f97316;font-size:12px;letter-spacing:2px;margin:0 0 12px;font-weight:bold;">🔥 WHAT TO EXPECT</p>
      <p style="color:#e5e5e5;font-size:13px;margin:4px 0;">• The audience will vote live using our 🔥 fire-rating system</p>
      <p style="color:#e5e5e5;font-size:13px;margin:4px 0;">• Investors can donate to support your startup in real-time</p>
      <p style="color:#e5e5e5;font-size:13px;margin:4px 0;">• Startups are ranked dynamically based on live votes</p>
      <p style="color:#e5e5e5;font-size:13px;margin:4px 0;">• A winner will be announced at the end of the event!</p>
      <p style="color:#e5e5e5;font-size:13px;margin:4px 0;">• NASA Technology Transfer Program speakers open the event</p>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align:center;margin:30px 0;">
      <a href="${registerUrl}" 
         style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:14px;letter-spacing:1px;margin-bottom:12px;">
        CREATE YOUR ACCOUNT 🚀
      </a>
      <br><br>
      <a href="${portalUrl}" 
         style="display:inline-block;background:transparent;color:#f97316;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:bold;font-size:13px;letter-spacing:1px;border:1px solid #f97316;">
        VIEW EVENT PORTAL 🔥
      </a>
    </div>

    <p style="color:#999;font-size:12px;text-align:center;margin-top:30px;border-top:1px solid #333;padding-top:20px;">
      Powered by Startup Factory Hub<br>
      <a href="https://startupfactoryhub.com" style="color:#f97316;text-decoration:none;">startupfactoryhub.com</a>
    </p>
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
        subject: "🔥 You're Invited to Pitch — Hot Deals in the Space Industry | April 16, 2026",
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
