import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-EVENT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const user = userData.user;
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");

    logStep("Verifying session", { sessionId, userId: user.id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session status", { paymentStatus: session.payment_status });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ paid: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if already processed
    const { data: existingPayment } = await supabaseAdmin
      .from("event_payments")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingPayment?.payment_status === "paid") {
      logStep("Already processed", { eventId: existingPayment.event_id });
      return new Response(JSON.stringify({ paid: true, eventId: existingPayment.event_id, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const eventId = session.metadata?.event_id;
    if (!eventId) throw new Error("No event_id in session metadata");

    // Update payment record
    await supabaseAdmin
      .from("event_payments")
      .update({
        payment_status: "paid",
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", sessionId);

    // Auto-register user as "going"
    await supabaseAdmin
      .from("event_attendees")
      .upsert({
        event_id: eventId,
        user_id: user.id,
        status: "going",
      });

    logStep("Payment verified and user registered", { eventId, userId: user.id });

    return new Response(JSON.stringify({ paid: true, eventId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
