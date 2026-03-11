import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OVERAGE_COST_PER_GB_CENTS = 250;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHARGE-STORAGE-OVERAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Get user's storage usage
    const { data: usageData, error: usageError } = await supabaseClient
      .from("user_storage_usage")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (usageError) throw new Error(`Usage fetch error: ${usageError.message}`);
    if (!usageData) {
      logStep("No usage record, nothing to charge");
      return new Response(JSON.stringify({ charged: false, reason: "No usage data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalUsed = usageData.total_bytes_used || 0;
    const planLimit = usageData.plan_limit_bytes || 1073741824;

    if (totalUsed <= planLimit) {
      logStep("Within plan limits, no overage");
      return new Response(JSON.stringify({ charged: false, reason: "Within plan limits" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const overageBytes = totalUsed - planLimit;
    const overageGb = Math.ceil(overageBytes / 1073741824);
    logStep("Overage detected", { overageBytes, overageGb });

    // Check how many GB have already been charged
    const { data: existingCharges } = await supabaseClient
      .from("storage_overages")
      .select("gb_charged")
      .eq("user_id", user.id);

    const alreadyChargedGb = (existingCharges || []).reduce((sum: number, c: any) => sum + c.gb_charged, 0);
    const newGbToCharge = overageGb - alreadyChargedGb;

    if (newGbToCharge <= 0) {
      logStep("Already charged for current overage");
      return new Response(JSON.stringify({ charged: false, reason: "Already charged" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Charging for new overage", { newGbToCharge, amount: newGbToCharge * OVERAGE_COST_PER_GB_CENTS });

    // Find or create Stripe customer
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    // Create invoice item for overage
    const amountCents = newGbToCharge * OVERAGE_COST_PER_GB_CENTS;
    
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amountCents,
      currency: "usd",
      description: `Storage overage: ${newGbToCharge} GB × $${(OVERAGE_COST_PER_GB_CENTS / 100).toFixed(2)}/GB`,
    });

    // Create and finalize invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: "charge_automatically",
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    logStep("Invoice created", { invoiceId: finalizedInvoice.id });

    // Log overage in DB
    await supabaseClient.from("storage_overages").insert({
      user_id: user.id,
      gb_charged: newGbToCharge,
      amount_cents: amountCents,
      stripe_invoice_id: finalizedInvoice.id,
    });

    return new Response(JSON.stringify({
      charged: true,
      gb_charged: newGbToCharge,
      amount_cents: amountCents,
      invoice_id: finalizedInvoice.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
