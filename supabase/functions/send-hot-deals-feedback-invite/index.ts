import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { to, recipientName } = await req.json();
    if (!to) {
      return new Response(JSON.stringify({ error: "Missing 'to'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const feedbackUrl = "https://startupfactoryhub.com/hot-deals/feedback";
    const portalUrl = "https://startupfactoryhub.com/hot-deals-space";
    const logoUrl =
      "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";

    const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid rgba(234,88,12,0.25);border-radius:16px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626 0%,#ea580c 50%,#f59e0b 100%);padding:36px 30px 32px;text-align:center;">
      <img src="${logoUrl}" alt="Startup Factory Hub" width="70" height="70" style="display:block;margin:0 auto 14px;border-radius:14px;border:2px solid rgba(255,255,255,0.3);" />
      <h1 style="color:#fff;font-size:22px;margin:0 0 4px;font-weight:800;letter-spacing:0.5px;">STARTUP FACTORY HUB</h1>
      <div style="width:60px;height:2px;background:rgba(255,255,255,0.5);margin:8px auto 12px;border-radius:2px;"></div>
      <div style="font-size:13px;color:#fff;font-weight:700;letter-spacing:2px;margin-bottom:10px;">&#9670; HOT DEALS &#9670;</div>
      <h2 style="color:#fff;font-size:22px;margin:0 0 6px;font-weight:700;">Rate Your Experience</h2>
      <p style="color:rgba(255,255,255,0.92);font-size:13px;margin:0;">Tell us how the Hot Deals event went</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 30px 8px;">
      <p style="color:#1f2937;font-size:15px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Thank you for being part of the latest <strong>Hot Deals</strong> event.
        Your perspective shapes how we run the next one — pitches, production quality,
        and the community vibe.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
        It takes about <strong>30 seconds</strong>, and it's <strong>completely anonymous</strong>.
        Rate the event from 1 to 5 stars across a few quick categories — drop a comment if you'd like.
      </p>

      <!-- Highlight card -->
      <div style="background:linear-gradient(135deg,rgba(234,88,12,0.08),rgba(245,158,11,0.05));border:1px solid rgba(234,88,12,0.25);border-radius:12px;padding:20px 22px;margin:0 0 28px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#ea580c;text-transform:uppercase;margin-bottom:8px;">What you'll rate</div>
        <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.8;">
          <li>Overall event experience</li>
          <li>Quality of the startup pitches</li>
          <li>Production &amp; live room</li>
          <li>Community &amp; networking</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:8px 0 28px;">
        <a href="${feedbackUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#ea580c;background-image:linear-gradient(135deg,#dc2626,#ea580c);color:#ffffff !important;text-decoration:none;font-weight:700;font-size:15px;padding:15px 38px;border-radius:12px;box-shadow:0 8px 24px rgba(234,88,12,0.35);letter-spacing:0.4px;">
          Rate the Event &rarr;
        </a>
        <div style="font-size:11px;color:#6b7280;margin-top:12px;letter-spacing:1px;text-transform:uppercase;">Anonymous &middot; 30 seconds</div>
        <div style="font-size:12px;color:#374151;margin-top:14px;">
          Or open directly: <a href="${feedbackUrl}" target="_blank" rel="noopener" style="color:#ea580c;text-decoration:underline;">${feedbackUrl}</a>
        </div>
      </div>

      <!-- Secondary link -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${portalUrl}" style="color:#ea580c;font-size:13px;text-decoration:none;font-weight:600;">
          &larr; Back to the Hot Deals Portal
        </a>
      </div>

      <!-- URL fallback -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:0 0 8px;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">If the button doesn't work</div>
        <div style="font-size:12px;color:#374151;word-break:break-all;font-family:monospace;">${feedbackUrl}</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0a0f1e;padding:24px 30px;text-align:center;border-top:1px solid rgba(234,88,12,0.2);">
      <img src="${logoUrl}" alt="SFH" width="32" height="32" style="display:block;margin:0 auto 8px;border-radius:8px;opacity:0.8;" />
      <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">Sent to <strong style="color:#d1d5db;">${to}</strong></p>
      <p style="color:#6b7280;font-size:11px;margin:8px 0 0;">
        &copy; 2025 Startup Factory Hub &middot;
        <a href="https://startupfactoryhub.com" style="color:#ea580c;text-decoration:none;">startupfactoryhub.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Startup Factory Hub <info@startupfactoryhub.com>",
        to: [to],
        subject: "Rate Your Hot Deals Experience — 30 seconds, anonymous",
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    console.log("Hot Deals feedback invite sent to:", to);

    return new Response(
      JSON.stringify({ success: true, emailId: data.id, feedbackUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("Error sending feedback invite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
