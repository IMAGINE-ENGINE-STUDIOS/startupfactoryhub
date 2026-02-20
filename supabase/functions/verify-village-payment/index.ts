import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-VILLAGE-PAYMENT] ${step}${detailsStr}`);
};

// Helper to log API usage (with multiplier for merchant villages)
async function logApiUsage(
  supabaseAdmin: any,
  serviceName: string,
  endpoint: string,
  estimatedCost: number,
  multiplier: number,
  userId: string
) {
  try {
    await supabaseAdmin.from("api_usage_logs").insert({
      service_name: serviceName,
      endpoint: endpoint,
      request_count: 1,
      estimated_cost: estimatedCost * multiplier,
      user_id: userId,
      metadata: {
        base_cost: estimatedCost,
        multiplier,
        village_billing: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error("Failed to log API usage:", e);
  }
}

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

    // Check if we already processed this session
    const { data: existingPurchase } = await supabaseAdmin
      .from("village_purchases")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingPurchase?.payment_status === "paid" && existingPurchase?.room_id) {
      logStep("Already processed", { roomId: existingPurchase.room_id });
      return new Response(JSON.stringify({ paid: true, roomId: existingPurchase.room_id, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const meta = session.metadata!;
    const villageName = meta.village_name;
    const villageDescription = meta.village_description || null;
    const villageType = meta.village_type as "democratic_republic" | "merchant_village";
    const apiMultiplier = parseFloat(meta.api_cost_multiplier || "1.0");
    const isPrivate = meta.is_private === "true";
    const joinFeeCents = parseInt(meta.join_fee_cents || "100");
    const govFundCents = parseInt(meta.gov_fund_cents || "100");

    logStep("Creating Whereby room", { villageName });

    // Create Whereby room (permanent — 10 years)
    const wherebyApiKey = Deno.env.get("WHEREBY_API_KEY");
    if (!wherebyApiKey) throw new Error("WHEREBY_API_KEY not configured");

    const tenYearsFromNow = new Date();
    tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

    const sanitizedName = villageName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 30);
    const wherebyRes = await fetch("https://api.whereby.dev/v1/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${wherebyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endDate: tenYearsFromNow.toISOString(),
        fields: ["hostRoomUrl"],
        roomNamePrefix: sanitizedName,
        roomMode: "normal",
      }),
    });

    if (!wherebyRes.ok) {
      const err = await wherebyRes.json();
      throw new Error(`Whereby error: ${err.message || wherebyRes.status}`);
    }

    const wherebyData = await wherebyRes.json();
    const meetingLink = wherebyData.roomUrl;

    // Log API usage with multiplier
    const wherebyBaseCost = 0.10;
    await logApiUsage(supabaseAdmin, "whereby", "/v1/meetings", wherebyBaseCost, apiMultiplier, user.id);

    logStep("Creating live room in DB");

    // Generate invitation code for private merchant villages
    const invitationCode = isPrivate
      ? Math.random().toString(36).substring(2, 10).toUpperCase()
      : null;

    // Insert the live_room
    const { data: room, error: roomError } = await supabaseAdmin
      .from("live_rooms")
      .insert({
        name: villageName,
        description: villageDescription,
        creator_id: user.id,
        meeting_link: meetingLink,
        is_public: !isPrivate,
        is_active: true,
        room_category: "village",
        village_type: villageType,
        api_cost_multiplier: apiMultiplier,
        expires_at: tenYearsFromNow.toISOString(),
        is_private: isPrivate,
        invitation_code: invitationCode,
        join_fee_cents: joinFeeCents,
        government_fund_cents: govFundCents,
        membership_fee_cents: joinFeeCents + govFundCents,
      })
      .select()
      .single();

    if (roomError) throw new Error(`Room creation failed: ${roomError.message}`);

    logStep("Room created", { roomId: room.id });

    // Update purchase record
    await supabaseAdmin
      .from("village_purchases")
      .update({
        room_id: room.id,
        stripe_payment_intent: session.payment_intent as string,
        total_paid_cents: session.amount_total,
        payment_status: "paid",
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", sessionId);

    // Create feed post
    await supabaseAdmin.from("feed_posts").insert({
      content: `🏘️ Just founded a new district: ${villageName}${villageDescription ? ` — ${villageDescription}` : ""}`,
      user_id: user.id,
      post_type: "live_room",
      room_data: {
        room_id: room.id,
        meeting_link: meetingLink,
        room_name: villageName,
        description: villageDescription,
        village_type: villageType,
      },
    });

    return new Response(JSON.stringify({ paid: true, roomId: room.id }), {
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
