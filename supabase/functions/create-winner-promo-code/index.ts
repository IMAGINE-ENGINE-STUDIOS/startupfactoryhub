import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe coupon (100% off, repeating 12 months) created for Hot Deals winners
const WINNER_COUPON_ID = "yMMQg6Vx";
const COMMUNITY_YEARLY_PRICE_ID = "price_1T7RV3K5N1RcUVuYMhTIZLSV";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `WINNER-${s}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { winnerId, startupId, userId } = await req.json();
    if (!winnerId || !startupId) throw new Error("winnerId and startupId required");

    // Idempotency: return existing code if any
    const { data: existing } = await admin
      .from("hot_deals_winner_codes")
      .select("*")
      .eq("winner_id", winnerId)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ promoCode: existing.promo_code, existing: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const code = generateCode();
    const promo = await stripe.promotionCodes.create({
      coupon: WINNER_COUPON_ID,
      code,
      max_redemptions: 1,
      restrictions: { first_time_transaction: false },
      metadata: { winner_id: winnerId, startup_id: startupId },
    });

    const { data: inserted, error } = await admin
      .from("hot_deals_winner_codes")
      .insert({
        winner_id: winnerId,
        startup_id: startupId,
        promo_code: code,
        stripe_coupon_id: WINNER_COUPON_ID,
        stripe_promotion_code_id: promo.id,
        tier: "community",
        yearly_value_cents: 378000,
        includes_earth_intelligence: true,
        total_bundle_value_cents: 594000,
      })
      .select()
      .single();

    if (error) throw error;

    // Grant Earth Intelligence bonus access if userId provided
    if (userId) {
      await admin.from("hot_deals_winner_bonus_access").upsert({
        winner_code_id: inserted.id,
        user_id: userId,
        perk_type: "earth_intelligence",
      }, { onConflict: "user_id,perk_type" });
    }

    return new Response(JSON.stringify({ promoCode: code, existing: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
