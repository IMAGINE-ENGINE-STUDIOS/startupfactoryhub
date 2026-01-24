import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  workspaceId: string;
  workspaceName: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  pricePerHour: number;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;

    // Parse booking request
    const bookingRequest: BookingRequest = await req.json();

    // Calculate total hours and price
    const [startHour, startMin] = bookingRequest.startTime.split(':').map(Number);
    const [endHour, endMin] = bookingRequest.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalHours = (endMinutes - startMinutes) / 60;
    const totalPrice = Math.round(totalHours * bookingRequest.pricePerHour * 100); // in cents

    if (totalHours <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid time range" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Workspace Booking: ${bookingRequest.workspaceName}`,
              description: `${bookingRequest.date} | ${bookingRequest.startTime} - ${bookingRequest.endTime} (${totalHours}h)`,
            },
            unit_amount: totalPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/hubs?booking=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/hubs?booking=cancelled`,
      metadata: {
        workspace_id: bookingRequest.workspaceId,
        workspace_name: bookingRequest.workspaceName,
        booking_date: bookingRequest.date,
        start_time: bookingRequest.startTime,
        end_time: bookingRequest.endTime,
        user_id: user.id,
        notes: bookingRequest.notes || "",
      },
    });

    // Create pending booking in database
    const { data: booking, error: bookingError } = await supabase
      .from("hub_bookings")
      .insert({
        user_id: user.id,
        venue_id: bookingRequest.workspaceId,
        booking_date: bookingRequest.date,
        start_time: bookingRequest.startTime,
        end_time: bookingRequest.endTime,
        total_price: totalPrice / 100, // Store in dollars
        status: "pending",
        payment_intent_id: session.payment_intent as string,
        notes: bookingRequest.notes,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      // Continue anyway - payment can still proceed
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        bookingId: booking?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in hub-book-workspace:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
