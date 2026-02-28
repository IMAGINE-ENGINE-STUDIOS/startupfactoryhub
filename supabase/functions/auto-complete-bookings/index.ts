import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Update all confirmed/needs_action bookings where to_datetime has passed
    const { data, error } = await supabase
      .from("hub_bookings")
      .update({ status: "completed" })
      .in("status", ["confirmed", "needs_action"])
      .lt("to_datetime", new Date().toISOString())
      .select("id");

    if (error) throw error;

    console.log(`Auto-completed ${data?.length || 0} bookings`);

    return new Response(
      JSON.stringify({ completed: data?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error auto-completing bookings:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
