import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-COHORT-PAYMENT] ${step}${detailsStr}`);
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

    const { cohortStartupId } = await req.json();
    
    if (!cohortStartupId) {
      throw new Error("Missing required parameter: cohortStartupId");
    }

    logStep("Verifying payment", { cohortStartupId });

    // Get cohort startup with session ID
    const { data: cohortStartup, error: fetchError } = await supabaseClient
      .from('cohort_startups')
      .select('stripe_session_id, payment_status, stripe_subscription_id')
      .eq('id', cohortStartupId)
      .single();

    if (fetchError || !cohortStartup) {
      throw new Error("Cohort startup not found");
    }

    if (cohortStartup.payment_status === 'paid') {
      logStep("Already paid");
      return new Response(JSON.stringify({ paid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!cohortStartup.stripe_session_id) {
      logStep("No session ID found");
      return new Response(JSON.stringify({ paid: false, reason: "no_session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check session status
    const session = await stripe.checkout.sessions.retrieve(cohortStartup.stripe_session_id);
    
    logStep("Session status", { 
      status: session.payment_status, 
      mode: session.mode,
      subscriptionId: session.subscription 
    });

    const isPaid = session.payment_status === 'paid';

    if (isPaid) {
      const updateData: any = {
        payment_status: 'paid',
        payment_completed_at: new Date().toISOString(),
        current_stage: 'active',
      };

      // If this was a subscription, store the subscription ID
      if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;
        
        updateData.stripe_subscription_id = subscriptionId;

        // Get subscription details to get the end date
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (subscription.cancel_at) {
            const endDate = new Date(subscription.cancel_at * 1000);
            updateData.subscription_end_date = endDate.toISOString().split('T')[0];
            logStep("Subscription end date set", { endDate: updateData.subscription_end_date });
          }
        } catch (subError) {
          logStep("Warning: Could not retrieve subscription details", { error: subError });
        }

        logStep("Subscription stored", { subscriptionId });
      }

      // Update to paid
      await supabaseClient
        .from('cohort_startups')
        .update(updateData)
        .eq('id', cohortStartupId);

      logStep("Payment confirmed and updated", { 
        mode: session.mode,
        hasSubscription: !!updateData.stripe_subscription_id 
      });

      return new Response(JSON.stringify({ 
        paid: true,
        mode: session.mode,
        subscriptionId: updateData.stripe_subscription_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ paid: false, status: session.payment_status }), {
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