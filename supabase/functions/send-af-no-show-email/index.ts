// "Sorry we missed you" follow-up for Accelerated Fundraising interview no-shows.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";
import { buildAfNoShowHtml, AF_PROGRAM_URL } from "../_shared/af-emails.ts";
import { buildMvpFinalNoticeHtml, MVP_APPLY_URL } from "../_shared/mvp-final-notice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const email = body.email || body.to;
    const name = body.name || "Founder";
    const startup = body.startupName || "your startup";
    const cohort = body.cohortName || "Accelerated Fundraising";
    const interviewDate = body.interviewDate || "";
    const rescheduleUrl = body.rescheduleUrl || `${AF_PROGRAM_URL}?reschedule=1`;
    const isFinalNotice = body.template === "final-notice";

    if (body.validateTemplate === true) {
      return new Response(JSON.stringify({ success: true, template: isFinalNotice ? "final-notice" : "no-show" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !String(email).includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isFinalNotice) {
      const deadline = String(body.deadline || "in 72 hours");
      const confirmUrl = String(body.confirmUrl || MVP_APPLY_URL);
      await sendCompliantEmail({
        to: email,
        subject: `Final notice: ${startup} loses its MVP Program seat on ${deadline}`,
        html: buildMvpFinalNoticeHtml({ name, startup, cohort, deadline, confirmUrl }),
        source: "mvp-final-notice",
      });
    } else {
      await sendCompliantEmail({
        to: email,
        subject: `Sorry we missed you — let's reschedule your ${cohort} interview`,
        html: buildAfNoShowHtml({ name, startup, cohort, interviewDate, rescheduleUrl }),
        source: "af-no-show",
      });
    }

    return new Response(JSON.stringify({ success: true, template: isFinalNotice ? "final-notice" : "no-show" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-af-no-show-email error", e);
    return new Response(JSON.stringify({ error: e?.message || "Failed to send" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
