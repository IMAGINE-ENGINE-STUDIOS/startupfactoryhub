import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COHORT-PAYMENT] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    const { cohortStartupId, cohortId, startupEmail, startupName, enrollmentFee, acceleratorName } = await req.json();
    
    if (!cohortStartupId || !cohortId || !startupEmail || !enrollmentFee) {
      throw new Error("Missing required parameters: cohortStartupId, cohortId, startupEmail, enrollmentFee");
    }

    logStep("Request params", { cohortStartupId, cohortId, startupEmail, startupName, enrollmentFee });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: startupEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Get cohort details for price creation
    const { data: cohort, error: cohortError } = await supabaseClient
      .from('accelerator_cohorts')
      .select('name, stripe_price_id')
      .eq('id', cohortId)
      .single();

    if (cohortError) {
      logStep("Cohort fetch error", { error: cohortError.message });
      throw new Error(`Failed to fetch cohort: ${cohortError.message}`);
    }

    let priceId = cohort.stripe_price_id;

    // Create Stripe product and price if not exists
    if (!priceId) {
      logStep("Creating Stripe product and price");
      
      const product = await stripe.products.create({
        name: `${acceleratorName || 'Accelerator'} - ${cohort.name} Enrollment`,
        description: `Enrollment fee for ${cohort.name} cohort program`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: enrollmentFee, // in cents
        currency: 'usd',
      });

      priceId = price.id;

      // Save price ID to cohort
      await supabaseClient
        .from('accelerator_cohorts')
        .update({ stripe_price_id: priceId })
        .eq('id', cohortId);

      logStep("Created Stripe price", { priceId, productId: product.id });
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "https://zqiihhmdsdgwdcwmryym.lovableproject.com";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : startupEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard?payment=success&cohort_startup=${cohortStartupId}`,
      cancel_url: `${origin}/dashboard?payment=cancelled`,
      metadata: {
        cohort_startup_id: cohortStartupId,
        cohort_id: cohortId,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update cohort_startups with session ID and pending status
    const { error: updateError } = await supabaseClient
      .from('cohort_startups')
      .update({
        stripe_session_id: session.id,
        payment_status: 'pending_payment',
      })
      .eq('id', cohortStartupId);

    if (updateError) {
      logStep("Failed to update cohort_startup", { error: updateError.message });
    }

    return new Response(JSON.stringify({ 
      url: session.url, 
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
