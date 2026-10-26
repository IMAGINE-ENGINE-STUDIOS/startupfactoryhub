// Innovation Coffee Table invitation sender.
// © Imagine Engine Studios Corp. — built for Startup Factory Hub.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendCompliantEmail } from "../_shared/email-compliance.ts";
import { buildInnovationCoffeeHtml } from "../_shared/innovation-coffee-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const email = body.email || body.to;
    if (!email || !String(email).includes("@")) return json({ error: "Valid email is required" }, 400);
    await sendCompliantEmail({
      to: email,
      subject: "Today: Innovation Coffee Table at Foxtail Coffee, Belle Isle",
      html: buildInnovationCoffeeHtml({ name: body.name, when: body.when }),
      source: "innovation-coffee",
    });
    return json({ success: true });
  } catch (e: any) {
    console.error("send-innovation-coffee-email error", e);
    return json({ error: e?.message || "Failed to send" }, 500);
  }
});
