import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { AccessToken } from "npm:livekit-server-sdk@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (v: unknown, fallback: string) => {
  const s = typeof v === "string" ? v.trim() : "";
  return /^[A-Za-z0-9_\-.:@]{1,64}$/.test(s) ? s : fallback;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const url = Deno.env.get("LIVEKIT_URL");
    if (!apiKey || !apiSecret || !url) {
      return json({ error: "LiveKit is not configured (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL)." }, 500);
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    const room = clean(body.roomName ?? body.room, "main");
    const identity = clean(body.identity, `user-${crypto.randomUUID().slice(0, 8)}`);
    const name = typeof body.name === "string" ? body.name.slice(0, 80) : identity;

    const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "2h" });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
    const token = await at.toJwt();

    return json({ token, url, room, identity });
  } catch (e) {
    console.error("livekit-token error", e);
    return json({ error: e instanceof Error ? e.message : "Token error" }, 500);
  }
});
