// Profile shop checkout: buyers pay the platform Stripe account for a seller's product/service.
// Prices are read server-side from profile_listings; paid sessions are recorded in profile_sales (10% platform fee).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.5.0";

const FEE_RATE = 0.10;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sk = Deno.env.get("STRIPE_SECRET_KEY");
    if (!sk) return json({ error: "Payments are not configured yet." }, 500);
    const stripe = new Stripe(sk, { apiVersion: "2025-08-27.basil" });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));

    let buyer: { id: string; email?: string } | null = null;
    const auth = req.headers.get("Authorization");
    if (auth) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data } = await sb.auth.getUser();
      if (data.user) buyer = { id: data.user.id, email: data.user.email || undefined };
    }

    if (body.action === "verify") {
      const sid = String(body.session_id || "");
      if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return json({ error: "Invalid session" }, 400);
      const s = await stripe.checkout.sessions.retrieve(sid);
      if (s.metadata?.source !== "profile-shop") return json({ error: "Not a profile sale" }, 400);
      if (s.payment_status !== "paid") return json({ paid: false });
      const amount = s.amount_total || 0;
      const { error } = await admin.from("profile_sales").upsert({
        listing_id: s.metadata.listing_id || null,
        listing_title: s.metadata.title || "Item",
        seller_id: s.metadata.seller_id,
        buyer_id: s.metadata.buyer_id || null,
        buyer_email: s.customer_details?.email || s.customer_email || null,
        quantity: Number(s.metadata.qty || 1),
        amount_cents: amount,
        platform_fee_cents: Math.round(amount * FEE_RATE),
        currency: s.currency || "usd",
        stripe_session_id: s.id,
        status: "paid",
      }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
      if (error) throw error;
      return json({ paid: true, title: s.metadata.title });
    }

    // Create a checkout session
    const ret = String(body.returnUrl || "");
    if (!/^https?:\/\//.test(ret) || ret.length > 500) return json({ error: "Invalid return address" }, 400);
    const qty = Math.max(1, Math.min(99, Math.floor(Number(body.qty) || 1)));
    const { data: listing } = await admin.from("profile_listings").select("*").eq("id", String(body.listing_id || "")).maybeSingle();
    if (!listing || !listing.active) return json({ error: "This item is no longer available." }, 404);
    if (listing.price_cents < 50) return json({ error: "This item has no price set." }, 400);
    if (buyer && buyer.id === listing.user_id) return json({ error: "You can't buy your own item." }, 400);

    const sep = ret.includes("?") ? "&" : "?";
    const images = (listing.images || []).filter((u: string) => /^https:\/\//.test(u)).slice(0, 1);
    const s = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: qty, price_data: { currency: listing.currency || "usd", unit_amount: listing.price_cents, product_data: { name: listing.title.slice(0, 120), images: images.length ? images : undefined } } }],
      ...(buyer?.email ? { customer_email: buyer.email } : {}),
      success_url: `${ret}${sep}sale=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ret}${sep}sale=cancel`,
      metadata: { source: "profile-shop", listing_id: listing.id, seller_id: listing.user_id, buyer_id: buyer?.id || "", qty: String(qty), title: listing.title.slice(0, 200) },
    });
    return json({ url: s.url });
  } catch (e) {
    console.error("[profile-checkout]", e);
    return json({ error: e instanceof Error ? e.message : "Checkout failed" }, 500);
  }
});
