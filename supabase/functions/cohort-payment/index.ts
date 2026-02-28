import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee

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

    const { 
      cohortStartupId, 
      cohortId, 
      startupEmail, 
      startupName, 
      enrollmentFee, 
      acceleratorName,
      paymentType = 'one_time',
      durationMonths = 1
    } = await req.json();
    
    if (!cohortStartupId || !cohortId || !startupEmail || !enrollmentFee) {
      throw new Error("Missing required parameters: cohortStartupId, cohortId, startupEmail, enrollmentFee");
    }

    logStep("Request params", { 
      cohortStartupId, 
      cohortId, 
      startupEmail, 
      startupName, 
      enrollmentFee, 
      paymentType,
      durationMonths 
    });

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
      .select('name, stripe_price_id, stripe_product_id, payment_type, payment_duration_months, accelerator_id')
      .eq('id', cohortId)
      .single();

    if (cohortError) {
      logStep("Cohort fetch error", { error: cohortError.message });
      throw new Error(`Failed to fetch cohort: ${cohortError.message}`);
    }

    const isMonthly = paymentType === 'monthly';
    
    // SFH's own accelerator ID - no commission for platform-owned programs
    const SFH_ACCELERATOR_ID = 'abd41d15-f707-4e36-b2f5-3a08d7b7b13a';
    const isPlatformOwned = cohort.accelerator_id === SFH_ACCELERATOR_ID;
    
    // Calculate platform fee - add 10% to the price (skip for platform-owned programs)
    const feeAmountInCents = enrollmentFee; // Already in cents
    const platformFeeInCents = isPlatformOwned ? 0 : Math.round(feeAmountInCents * PLATFORM_FEE_PERCENTAGE);
    const totalAmountInCents = feeAmountInCents + platformFeeInCents;

    logStep("Fee calculation", {
      originalFee: feeAmountInCents,
      platformFee: platformFeeInCents,
      totalAmount: totalAmountInCents,
      isPlatformOwned,
      isMonthly,
      durationMonths: isMonthly ? durationMonths : 1
    });

    let priceId = cohort.stripe_price_id;
    let productId = cohort.stripe_product_id;

    // Create Stripe product if not exists
    if (!productId) {
      logStep("Creating Stripe product");
      
      const product = await stripe.products.create({
        name: `${acceleratorName || 'Accelerator'} - ${cohort.name} Enrollment`,
        description: `Enrollment fee for ${cohort.name} cohort program`,
      });

      productId = product.id;

      // Save product ID to cohort
      await supabaseClient
        .from('accelerator_cohorts')
        .update({ stripe_product_id: productId })
        .eq('id', cohortId);

      logStep("Created Stripe product", { productId });
    }

    // Create price - always create a new price to ensure correct amount
    // This allows for dynamic pricing per cohort
    logStep("Creating Stripe price", { isMonthly, totalAmountInCents });

    const priceParams: Stripe.PriceCreateParams = {
      product: productId,
      unit_amount: totalAmountInCents,
      currency: 'usd',
    };

    if (isMonthly) {
      priceParams.recurring = { interval: 'month' };
    }

    const price = await stripe.prices.create(priceParams);
    priceId = price.id;

    // Save price ID to cohort
    await supabaseClient
      .from('accelerator_cohorts')
      .update({ stripe_price_id: priceId })
      .eq('id', cohortId);

    logStep("Created Stripe price", { priceId });

    // Create checkout session
    const origin = req.headers.get("origin") || "https://zqiihhmdsdgwdcwmryym.lovableproject.com";
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : startupEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isMonthly ? "subscription" : "payment",
      success_url: `${origin}/dashboard?payment=success&cohort_startup=${cohortStartupId}`,
      cancel_url: `${origin}/dashboard?payment=cancelled`,
      metadata: {
        cohort_startup_id: cohortStartupId,
        cohort_id: cohortId,
        payment_type: paymentType,
        duration_months: String(durationMonths),
        platform_fee_cents: String(platformFeeInCents),
      },
    };

    // For monthly subscriptions with fixed duration, set cancel_at
    if (isMonthly && durationMonths > 0) {
      const cancelAtDate = new Date();
      cancelAtDate.setMonth(cancelAtDate.getMonth() + durationMonths);
      sessionParams.subscription_data = {
        metadata: {
          cohort_startup_id: cohortStartupId,
          cohort_id: cohortId,
          duration_months: String(durationMonths),
        },
        cancel_at: Math.floor(cancelAtDate.getTime() / 1000),
      };
      logStep("Set subscription cancel_at", { cancelAt: cancelAtDate.toISOString() });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url, mode: sessionParams.mode });

    // Calculate subscription end date for monthly
    let subscriptionEndDate = null;
    if (isMonthly && durationMonths > 0) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);
      subscriptionEndDate = endDate.toISOString().split('T')[0];
    }

    // Update cohort_startups with session ID and pending status
    const updateData: any = {
      stripe_session_id: session.id,
      payment_status: 'pending_payment',
    };

    if (subscriptionEndDate) {
      updateData.subscription_end_date = subscriptionEndDate;
    }

    const { error: updateError } = await supabaseClient
      .from('cohort_startups')
      .update(updateData)
      .eq('id', cohortStartupId);

    if (updateError) {
      logStep("Failed to update cohort_startup", { error: updateError.message });
    }

    return new Response(JSON.stringify({ 
      url: session.url, 
      sessionId: session.id,
      mode: isMonthly ? 'subscription' : 'payment',
      platformFee: platformFeeInCents / 100,
      totalAmount: totalAmountInCents / 100
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