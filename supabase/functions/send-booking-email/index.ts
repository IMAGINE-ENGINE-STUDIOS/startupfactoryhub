import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  to: string;
  bookerName: string;
  hostName: string;
  date: string;
  time: string;
  duration: number;
  meetingType: string;
  meetingLink?: string;
  location?: string;
  topic?: string;
  type: "new_booking" | "booking_confirmed";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BookingEmailRequest = await req.json();
    const { to, bookerName, hostName, date, time, duration, meetingType, meetingLink, location, topic, type } = body;

    if (!to || !bookerName || !date || !time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isConfirmation = type === "booking_confirmed";
    const subject = isConfirmation
      ? `Your meeting with ${hostName} is confirmed!`
      : `Booking request submitted – ${hostName}`;

    const meetingTypeLabel = meetingType === "virtual" ? "Video Call" : meetingType === "pitch" ? "Pitch Meeting" : "In Person";

    const meetingDetails = `
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Date</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${date}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Time</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${time}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Duration</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${duration} minutes</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Type</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${meetingTypeLabel}</td></tr>
      ${topic ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Topic</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${topic}</td></tr>` : ""}
      ${meetingLink ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Meeting Link</td><td style="padding:6px 0;font-size:14px;"><a href="${meetingLink}" style="color:#16a34a;text-decoration:underline;">Join Meeting</a></td></tr>` : ""}
      ${location ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Location</td><td style="padding:6px 0;font-size:14px;font-weight:600;">${location}</td></tr>` : ""}
    `;

    const headline = isConfirmation
      ? `Great news, ${bookerName}! Your meeting has been confirmed.`
      : `Hi ${bookerName}, your booking request has been submitted successfully.`;

    const statusBadge = isConfirmation
      ? `<span style="display:inline-block;background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">✓ Confirmed</span>`
      : `<span style="display:inline-block;background:#fef3c7;color:#d97706;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">⏳ Pending Confirmation</span>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Startup Factory Hub</h1>
          <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">${isConfirmation ? "Meeting Confirmed" : "Booking Request Received"}</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#1f2937;line-height:1.6;">${headline}</p>
          <div style="text-align:center;margin:0 0 24px;">${statusBadge}</div>
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px;">
            <h3 style="margin:0 0 12px;font-size:15px;color:#374151;">Meeting with ${hostName}</h3>
            <table width="100%" cellpadding="0" cellspacing="0">${meetingDetails}</table>
          </div>
          ${!isConfirmation ? `<p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">You will receive another email once your meeting is confirmed by the host.</p>` : ""}
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Startup Factory Hub. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: "Startup Factory Hub <info@startupfactoryhub.com>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
