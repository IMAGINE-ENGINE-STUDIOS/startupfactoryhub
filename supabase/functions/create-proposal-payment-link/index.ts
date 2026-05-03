import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const body = await req.json();
    const {
      proposalNumber,
      currency = "usd",
      oneTimeAmount = 0, // in cents
      monthlyAmount = 0, // in cents
      yearlyAmount = 0,  // in cents
      clientName,
      clientEmail,
    } = body;

    if (oneTimeAmount <= 0 && monthlyAmount <= 0 && yearlyAmount <= 0) {
      throw new Error("At least one amount (one-time, monthly, or yearly) must be > 0");
    }

    if (monthlyAmount > 0 && yearlyAmount > 0) {
      throw new Error("Payment links support only one recurring interval. Combine monthly OR yearly, not both.");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const cur = currency.toLowerCase();
    const lineItems: { price: string; quantity: number }[] = [];

    if (oneTimeAmount > 0) {
      const product = await stripe.products.create({
        name: `Proposal ${proposalNumber} — One-time`,
        description: clientName ? `For ${clientName}` : undefined,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(oneTimeAmount),
        currency: cur,
      });
      lineItems.push({ price: price.id, quantity: 1 });
    }

    if (monthlyAmount > 0) {
      const product = await stripe.products.create({
        name: `Proposal ${proposalNumber} — Monthly`,
        description: clientName ? `Recurring for ${clientName}` : undefined,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(monthlyAmount),
        currency: cur,
        recurring: { interval: "month" },
      });
      lineItems.push({ price: price.id, quantity: 1 });
    }

    if (yearlyAmount > 0) {
      const product = await stripe.products.create({
        name: `Proposal ${proposalNumber} — Yearly`,
        description: clientName ? `Recurring for ${clientName}` : undefined,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(yearlyAmount),
        currency: cur,
        recurring: { interval: "year" },
      });
      lineItems.push({ price: price.id, quantity: 1 });
    }

    const link = await stripe.paymentLinks.create({
      line_items: lineItems,
      metadata: {
        proposal_number: proposalNumber || "",
        client_name: clientName || "",
        client_email: clientEmail || "",
      },
    });

    return new Response(JSON.stringify({ url: link.url, id: link.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-proposal-payment-link]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
