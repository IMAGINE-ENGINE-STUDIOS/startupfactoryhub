import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";
import { buildMvpFinalNoticeHtml, MVP_APPLY_URL } from "../_shared/mvp-final-notice.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "Founder");
    const startup = String(body.startupName || "Your startup");
    const cohort = String(body.cohortName || "MVP Program");
    const deadline = String(body.deadline || "in 72 hours");
    const confirmUrl = String(body.confirmUrl || MVP_APPLY_URL);

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendCompliantEmail({
      to: email,
      subject: `Final notice: ${startup} loses its MVP Program seat on ${deadline}`,
      html: buildMvpFinalNoticeHtml({ name, startup, cohort, deadline, confirmUrl }),
      source: "mvp-final-notice",
    });

    return new Response(JSON.stringify({ success: true, template: "final-notice" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send final notice";
    console.error("send-mvp-final-notice error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});