import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "close" | "delete";

type RequestBody = {
  action: Action;
  roomId: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return json(500, { error: "Supabase env not configured" });
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    // Authenticated client (uses caller JWT)
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      return json(401, { error: "Unauthorized" });
    }

    const body = (await req.json()) as Partial<RequestBody>;
    const action = body.action;
    const roomId = body.roomId;

    if ((action !== "close" && action !== "delete") || !roomId) {
      return json(400, { error: "Invalid request" });
    }

    // Service role client (bypasses RLS) but we enforce authorization above.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: room, error: roomError } = await supabaseAdmin
      .from("live_rooms")
      .select("id, creator_id")
      .eq("id", roomId)
      .maybeSingle();

    if (roomError) {
      return json(500, { error: roomError.message });
    }

    if (!room) {
      return json(404, { error: "Room not found" });
    }

    if (room.creator_id !== user.id) {
      return json(403, { error: "Forbidden" });
    }

    // Main action
    if (action === "close") {
      const { error } = await supabaseAdmin
        .from("live_rooms")
        .update({ is_active: false })
        .eq("id", roomId);

      if (error) {
        return json(500, { error: error.message });
      }
    } else {
      const { error } = await supabaseAdmin.from("live_rooms").delete().eq("id", roomId);
      if (error) {
        return json(500, { error: error.message });
      }
    }

    // Cleanup (best effort)
    await supabaseAdmin.from("live_room_participants").delete().eq("room_id", roomId);

    await supabaseAdmin
      .from("feed_posts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_type", "live_room")
      .contains("room_data", { room_id: roomId } as any);

    return json(200, { ok: true });
  } catch (e) {
    console.error("live-room-actions error:", e);
    return json(500, { error: e?.message ?? "Unknown error" });
  }
});
