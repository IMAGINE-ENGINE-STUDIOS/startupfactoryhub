import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Find hot deals invitation by email
    const { data: invitation, error: invError } = await supabase
      .from("hot_deals_invited_startups")
      .select("*")
      .eq("contact_email", user.email)
      .is("user_id", null)
      .maybeSingle();

    if (invError) throw new Error(`Invitation lookup error: ${invError.message}`);
    if (!invitation) {
      return new Response(JSON.stringify({ synced: false, message: "No pending invitation found for this email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company profile (oldest one)
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, description, logo_url, website, industry, pitch_deck_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    // Get user's payout account for Stripe Connect
    const { data: payoutAccount } = await supabase
      .from("payout_accounts")
      .select("stripe_connect_account_id, account_status")
      .eq("user_id", user.id)
      .maybeSingle();

    // Update the hot deals invitation with user data
    const updateData: Record<string, any> = {
      user_id: user.id,
      confirmed: true,
    };

    if (company) {
      updateData.company_name = company.name;
      updateData.description = company.description;
      updateData.logo_url = company.logo_url;
      updateData.pitch_deck_url = company.pitch_deck_url;
    }

    if (payoutAccount?.stripe_connect_account_id) {
      updateData.stripe_connect_account_id = payoutAccount.stripe_connect_account_id;
    }

    const { error: updateError } = await supabase
      .from("hot_deals_invited_startups")
      .update(updateData)
      .eq("id", invitation.id);

    if (updateError) throw new Error(`Update error: ${updateError.message}`);

    return new Response(JSON.stringify({
      synced: true,
      startup_id: invitation.id,
      company_synced: !!company,
      stripe_connected: !!payoutAccount?.stripe_connect_account_id,
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
