// Live Video checkout: Startup Factory Hub packages (real Stripe prices) and host products, paid to the platform Stripe account.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@18.5.0";

const PACKAGES: Record<string, string> = {
  "members-monthly": "price_1UBP5CK5N1RcUVuYE6ZLPaqv",
  "members-yearly": "price_1UBP6kK5N1RcUVuYyxfwBHLw",
  "investor-monthly": "price_1UBQRQK5N1RcUVuYhduCrhAJ",
  "investor-yearly": "price_1UBQaNK5N1RcUVuYg0edBdei",
  "imagine-starter": "price_1UNF7bK5N1RcUVuYHlnpmkkA",
  "imagine-pro": "price_1UNF7vK5N1RcUVuY121ICYxa",
  "imagine-studio": "price_1UNapwK5N1RcUVuYx1SW05kL",
  "community": "price_1T5gbKK5N1RcUVuY9hOEPizG",
  "self-paced-office": "price_1T5gbrK5N1RcUVuYcLTffimY",
  "global-access": "price_1T7RUQK5N1RcUVuYcgiZRLiH",
  "corporate": "price_1T7RUiK5N1RcUVuYJnD08hEl",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sk = Deno.env.get("STRIPE_SECRET_KEY");
    if (!sk) return json({ error: "Payments are not configured yet." }, 500);
    const stripe = new Stripe(sk, { apiVersion: "2025-08-27.basil" });
    const body = await req.json().catch(() => ({}));

    const ret = String(body.returnUrl || "");
    if (!/^https?:\/\//.test(ret) || ret.length > 500) return json({ error: "Invalid return address" }, 400);
    const sep = ret.includes("?") ? "&" : "?";

    let email: string | undefined;
    const auth = req.headers.get("Authorization");
    if (auth) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data } = await sb.auth.getUser();
      email = data.user?.email || undefined;
    }
    let customer: string | undefined;
    if (email) customer = (await stripe.customers.list({ email, limit: 1 })).data[0]?.id;
    const who = customer ? { customer } : email ? { customer_email: email } : {};
    const urls = { success_url: `${ret}${sep}checkout=success`, cancel_url: `${ret}${sep}checkout=cancel` };

    // One package = one subscription
    if (body.pkg) {
      const price = PACKAGES[String(body.pkg)];
      if (!price) return json({ error: "Unknown package" }, 400);
      const s = await stripe.checkout.sessions.create({ mode: "subscription", line_items: [{ price, quantity: 1 }], ...who, ...urls, metadata: { source: "live-video", pkg: String(body.pkg) } });
      return json({ url: s.url });
    }

    // Host products in the cart: one-time payment
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    const line_items = items.map((it: any) => {
      const price = Number(it.price), qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
      const name = String(it.name || "").trim().slice(0, 120);
      if (!name || !(price >= 0.5) || price > 100000) throw new Error("Invalid cart item");
      const images = typeof it.image === "string" && /^https:\/\//.test(it.image) && it.image.length < 1000 ? [it.image] : undefined;
      return { quantity: qty, price_data: { currency: "usd", unit_amount: Math.round(price * 100), product_data: { name, images } } };
    });
    if (!line_items.length) return json({ error: "Your cart is empty." }, 400);
    const s = await stripe.checkout.sessions.create({ mode: "payment", line_items, ...who, ...urls, metadata: { source: "live-video", room: String(body.room || "").slice(0, 64) } });
    return json({ url: s.url });
  } catch (e) {
    console.error("[live-checkout]", e);
    return json({ error: e instanceof Error ? e.message : "Checkout failed" }, 500);
  }
});
