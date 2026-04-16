import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const startups = [
      {
        company_name: "NuView",
        contact_email: "clint@nuview.space",
        logo_url: "/images/nuview-logo.jpg",
        confirmed: true,
        invitation_sent: true,
        description: "Space-based LiDAR technology for global 3D mapping",
      },
      {
        company_name: "Arachnid System",
        user_id: "7df76c2b-9026-4990-9128-9765f9fd92e0",
        contact_email: "ben@arachnidsys.com",
        logo_url: "/images/arachnid-logo.png",
        confirmed: true,
        invitation_sent: true,
        description: "Developing hyper-sensing robotics to inspect aircraft, spacecraft & launch vehicles",
      },
      {
        company_name: "Fibonacci Cellars",
        user_id: "5540ec1c-4b84-4d91-9211-be67a3877c13",
        contact_email: "alijenkins16@gmail.com",
        logo_url: "/images/fibonacci-logo.jpg",
        confirmed: true,
        invitation_sent: true,
        description: "Space brokerage and innovation services",
      },
    ];

    const results = [];
    for (const startup of startups) {
      const { data, error } = await supabase
        .from("hot_deals_invited_startups")
        .insert(startup)
        .select();
      results.push({ startup: startup.company_name, data, error: error?.message });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
