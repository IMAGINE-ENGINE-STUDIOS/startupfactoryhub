import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userId = "e689f5cb-6970-471b-b21e-e9d172862a15";

    // Delete storage objects first
    const buckets = ["avatars", "event-banners", "company-logos", "documents", "pitch-decks", 
                     "public-resumes", "temp-uploads", "feed-media", "study-room-files", 
                     "videos", "resource-assets", "ai-generated-images", "camera-snapshots", "dj-recordings"];
    
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(userId);
        if (files && files.length > 0) {
          const paths = files.map((f: any) => `${userId}/${f.name}`);
          await supabase.storage.from(bucket).remove(paths);
        }
      } catch (e) {
        // bucket might not have user folder
      }
    }

    // Now delete auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);

    return new Response(JSON.stringify({ 
      success: !error, 
      authError: error?.message,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
