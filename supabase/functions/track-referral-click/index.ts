import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { referral_code } = await req.json();
    if (!referral_code) throw new Error("Missing referral_code");

    // Verify the referral code exists
    const { data: account } = await supabase
      .from("referral_accounts")
      .select("id")
      .eq("referral_code", referral_code)
      .maybeSingle();

    if (!account) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Hash the IP for privacy
    const forwarded = req.headers.get("x-forwarded-for") || "unknown";
    const ip = forwarded.split(",")[0].trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + "referral-salt-sfh");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const userAgent = req.headers.get("user-agent") || "unknown";

    // Insert click record
    await supabase.from("referral_clicks").insert({
      referral_code,
      ip_hash: ipHash,
      user_agent: userAgent.substring(0, 500),
    });

    // Increment total_clicks
    await supabase.rpc("increment_referral_clicks", { code: referral_code }).catch(() => {
      // Fallback: manual increment if RPC doesn't exist
      return supabase
        .from("referral_accounts")
        .update({ total_clicks: account.id ? undefined : 0 })
        .eq("referral_code", referral_code);
    });

    // Direct SQL update for total_clicks
    const { data: currentAccount } = await supabase
      .from("referral_accounts")
      .select("total_clicks")
      .eq("referral_code", referral_code)
      .single();

    if (currentAccount) {
      await supabase
        .from("referral_accounts")
        .update({ total_clicks: (currentAccount.total_clicks || 0) + 1 })
        .eq("referral_code", referral_code);
    }

    return new Response(JSON.stringify({ success: true, redirect: `/auth?ref=${referral_code}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
