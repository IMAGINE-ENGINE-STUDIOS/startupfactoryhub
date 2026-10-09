// Legacy endpoint name kept so every existing caller keeps working.
// Rooms are now native Startup Factory Live Video rooms (LiveKit), not Whereby.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://startupfactoryhub.com/live-video";

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 30);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty ok */ }
    const prefix = typeof body.roomName === "string" ? slug(body.roomName) : "";
    const id = crypto.randomUUID().slice(0, 8);
    const room = `${prefix || "room"}-${id}`;
    const roomUrl = `${BASE}?room=${encodeURIComponent(room)}`;
    return new Response(JSON.stringify({ roomUrl, hostRoomUrl: roomUrl, meetingId: room, room }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
