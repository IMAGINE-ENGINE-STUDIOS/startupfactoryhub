import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "SFH-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user already has a referral account
    const { data: existing } = await supabase
      .from("referral_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        referral_code: existing.referral_code,
        referral_link: `https://startupfactoryhub.com/ref/${existing.referral_code}`,
        total_clicks: existing.total_clicks,
        total_referrals: existing.total_referrals,
        total_earned_cents: existing.total_earned_cents,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique referral code
    let referralCode = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: codeCheck } = await supabase
        .from("referral_accounts")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (!codeCheck) break;
      referralCode = generateCode();
      attempts++;
    }

    const { data: newAccount, error: insertError } = await supabase
      .from("referral_accounts")
      .insert({ user_id: user.id, referral_code: referralCode })
      .select()
      .single();

    if (insertError) throw new Error(`Insert error: ${insertError.message}`);

    return new Response(JSON.stringify({
      referral_code: newAccount.referral_code,
      referral_link: `https://startupfactoryhub.com/ref/${newAccount.referral_code}`,
      total_clicks: 0,
      total_referrals: 0,
      total_earned_cents: 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
