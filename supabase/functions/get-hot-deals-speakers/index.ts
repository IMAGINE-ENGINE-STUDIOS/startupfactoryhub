import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SPEAKER_IDS = [
  "8bf0a780-fc90-4e93-9b97-62b9accf5d14",
  "726968e7-19d2-48da-8254-ab31ae336c16",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, email, bio")
      .in("user_id", SPEAKER_IDS);

    if (error) throw error;

    // Map user_id to id for frontend compatibility
    const speakers = (data || []).map((s: any) => ({
      id: s.user_id,
      full_name: s.full_name,
      avatar_url: s.avatar_url,
      email: s.email,
      bio: s.bio,
    }));

    return new Response(JSON.stringify({ speakers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
