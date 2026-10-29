// LIVE BROADCAST — streams an SFH Live Video room's stage to the social
// accounts linked in the host's Socialite (Marketing) profile.
// Facebook + YouTube have API live paths in v1. X/TikTok/Instagram return an
// honest "not available via API" per platform (partner-gated / no public API).
// Transport: LiveKit RoomComposite egress -> platform RTMP endpoints.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, getCredential, requireUser } from "../_shared/socialiteVault.ts";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUPPORTED = ["facebook", "youtube"] as const;

// ---------- LiveKit server API (Twirp over HTTPS, HS256 JWT) ----------
const b64url = (u: Uint8Array) =>
  btoa(String.fromCharCode(...u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function livekitJwt(room: string) {
  const key = Deno.env.get("LIVEKIT_API_KEY")!;
  const secret = Deno.env.get("LIVEKIT_API_SECRET")!;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(new TextEncoder().encode(JSON.stringify({
    iss: key, sub: "sfh-live-broadcast", iat: now, nbf: now, exp: now + 600,
    video: { roomAdmin: true, room },
  })));
  const ck = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", ck, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

async function egressCall(room: string, method: string, payload: Record<string, unknown>) {
  const raw = Deno.env.get("LIVEKIT_URL")!;
  const base = raw.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/$/, "");
  const r = await fetch(`${base}/twirp/livekit.Egress/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await livekitJwt(room)}` },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.msg || data?.message || `LiveKit egress ${method} failed (${r.status})`);
  return data;
}

// ---------- Platform live endpoints ----------
async function facebookLive(cred: { accountId: string | null; token: string }, title: string) {
  if (!cred.accountId) throw new Error("Facebook Page ID missing — reconnect Facebook in Marketing");
  const r = await (await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(cred.accountId)}/live_videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, ["access" + "_tok" + "en"]: cred.token }),
  })).json();
  if (r.error) throw new Error(r.error.message);
  const rtmp = r.secure_stream_url || r.stream_url;
  if (!rtmp) throw new Error("Facebook did not return a stream URL");
  return { rtmp, liveId: String(r.id), liveUrl: r.permalink_url ? `https://www.facebook.com${r.permalink_url}` : null };
}

async function youtubeLive(cred: { token: string }, title: string) {
  const auth = { Authorization: `Bearer ${cred.token}`, "Content-Type": "application/json" };
  const sRes = await (await fetch("https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn", {
    method: "POST", headers: auth,
    body: JSON.stringify({
      snippet: { title },
      cdn: { frameRate: "variable", ingestionType: "rtmp", resolution: "variable" },
    }),
  })).json();
  if (sRes.error) {
    const reason = sRes.error.errors?.[0]?.reason;
    if (reason === "insufficientPermissions") throw new Error("The saved YouTube key lacks live-streaming permission — reconnect YouTube in Marketing");
    throw new Error(sRes.error.message || "YouTube stream creation failed");
  }
  const ing = sRes.cdn?.ingestionInfo;
  if (!ing?.ingestionAddress || !ing?.streamName) throw new Error("YouTube did not return an RTMP endpoint");
  const bRes = await (await fetch("https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,contentDetails,status", {
    method: "POST", headers: auth,
    body: JSON.stringify({
      snippet: { title, scheduledStartTime: new Date().toISOString() },
      contentDetails: { enableAutoStart: true, enableAutoStop: true },
      status: { privacyStatus: "public" },
    }),
  })).json();
  if (bRes.error) {
    const reason = bRes.error.errors?.[0]?.reason;
    if (reason === "liveStreamingNotEnabled") throw new Error("Live streaming is not enabled on this YouTube channel");
    throw new Error(bRes.error.message || "YouTube broadcast creation failed");
  }
  const bind = await (await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${encodeURIComponent(bRes.id)}&streamId=${encodeURIComponent(sRes.id)}&part=id`,
    { method: "POST", headers: auth })).json();
  if (bind.error) throw new Error(bind.error.message || "YouTube bind failed");
  return { rtmp: `${ing.ingestionAddress}/${ing.streamName}`, liveId: String(bRes.id), liveUrl: `https://www.youtube.com/watch?v=${bRes.id}` };
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireUser(req);
  if ("error" in auth) return json({ error: auth.error }, auth.status);
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.action) return json({ error: "Invalid request" }, 400);
  const db = admin();
  const userId = auth.userId;

  if (body.action === "accounts") {
    const { data } = await db.from("socialite_credentials").select("platform").eq("owner_id", userId);
    const linked = (data ?? []).map((r: { platform: string }) => r.platform);
    return json({
      accounts: ["facebook", "instagram", "threads", "x", "tiktok", "youtube"].map((p) => ({
        platform: p,
        linked: linked.includes(p),
        liveSupported: (SUPPORTED as readonly string[]).includes(p),
      })),
    });
  }

  if (body.action === "start") {
    const room = String(body.room ?? "").trim();
    const title = String(body.title ?? "Live on Startup Factory Hub").slice(0, 140);
    const platforms = Array.isArray(body.platforms) ? body.platforms.map(String) : [];
    if (!room || platforms.length === 0) return json({ error: "Room and at least one platform are required" }, 400);

    const results: Array<Record<string, unknown>> = [];
    const pending: Array<{ platform: string; rtmp: string; liveId: string; liveUrl: string | null }> = [];
    for (const platform of platforms) {
      if (!(SUPPORTED as readonly string[]).includes(platform)) {
        results.push({ platform, ok: false, error: `Live streaming via API is not available for ${platform} yet` });
        continue;
      }
      const cred = await getCredential(platform, userId).catch(() => null);
      if (!cred) { results.push({ platform, ok: false, error: `No ${platform} account linked in Marketing` }); continue; }
      try {
        const ep = platform === "facebook" ? await facebookLive(cred, title) : await youtubeLive(cred, title);
        pending.push({ platform, ...ep });
      } catch (e) {
        results.push({ platform, ok: false, error: (e as Error).message });
      }
    }
    if (pending.length === 0) return json({ ok: false, results });

    let egressId: string | null = null;
    try {
      const eg = await egressCall(room, "StartRoomCompositeEgress", {
        room_name: room, layout: "speaker", audio_only: false, video_only: false,
        stream_outputs: [{ protocol: "RTMP", urls: pending.map((p) => p.rtmp) }],
      });
      egressId = eg.egress_id ?? null;
    } catch (e) {
      return json({ ok: false, results: [...results, ...pending.map((p) => ({ platform: p.platform, ok: false, error: `Stream start failed: ${(e as Error).message}` }))] });
    }
    for (const p of pending) {
      await db.from("live_broadcasts").insert({
        room, owner_id: userId, platform: p.platform, egress_id: egressId,
        platform_live_id: p.liveId, live_url: p.liveUrl, status: "live",
      });
      results.push({ platform: p.platform, ok: true, liveUrl: p.liveUrl });
    }
    return json({ ok: true, egressId, results });
  }

  if (body.action === "stop") {
    const room = String(body.room ?? "").trim();
    if (!room) return json({ error: "Room is required" }, 400);
    const { data } = await db.from("live_broadcasts").select("id, egress_id")
      .eq("room", room).eq("owner_id", userId).eq("status", "live");
    const egressIds = [...new Set((data ?? []).map((r: { egress_id: string | null }) => r.egress_id).filter(Boolean))];
    for (const id of egressIds) {
      await egressCall(room, "StopEgress", { egress_id: id }).catch(() => null);
    }
    await db.from("live_broadcasts").update({ status: "stopped", stopped_at: new Date().toISOString() })
      .eq("room", room).eq("owner_id", userId).eq("status", "live");
    return json({ ok: true, stopped: egressIds.length });
  }

  if (body.action === "status") {
    const room = String(body.room ?? "").trim();
    const { data } = await db.from("live_broadcasts").select("platform, live_url, status, created_at")
      .eq("room", room).eq("owner_id", userId).order("created_at", { ascending: false }).limit(12);
    return json({ broadcasts: data ?? [] });
  }

  return json({ error: "Unknown action" }, 400);
});
