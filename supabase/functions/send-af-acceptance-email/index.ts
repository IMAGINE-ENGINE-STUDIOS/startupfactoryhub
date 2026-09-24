// Acceptance email for the Accelerated Fundraising program (free, investor-matching batch).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";
import { buildAfAcceptanceHtml } from "../_shared/af-emails.ts";

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
    const startup = body.startupName || "Your startup";
    const cohort = body.cohortName || "Accelerated Fundraising";
    const interviewDate = body.interviewDate || "";

    if (!email || !String(email).includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendCompliantEmail({
      to: email,
      subject: `You're accepted into ${cohort}`,
      html: buildAfAcceptanceHtml({ name, startup, cohort, interviewDate }),
      source: "af-acceptance",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-af-acceptance-email error", e);
    return new Response(JSON.stringify({ error: e?.message || "Failed to send" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
