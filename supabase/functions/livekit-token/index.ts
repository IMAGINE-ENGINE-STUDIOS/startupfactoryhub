import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
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
    const sanitize = (v?: string) => v?.trim().replace(/^['"]|['"]$/g, "").trim();
    const apiKey = sanitize(Deno.env.get("LIVEKIT_API_KEY"));
    const apiSecret = sanitize(Deno.env.get("LIVEKIT_API_SECRET"));
    const url = sanitize(Deno.env.get("LIVEKIT_URL"))?.replace(/\/+$/, "");
    if (!apiKey || !apiSecret || !url) {
      return json({ error: "LiveKit is not configured (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL)." }, 500);
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    const room = clean(body.roomName ?? body.room, "main");
    const identity = clean(body.identity, `user-${crypto.randomUUID().slice(0, 8)}`);
    const name = typeof body.name === "string" ? body.name.slice(0, 80) : identity;

    // ---- Join gate: room bans + access mode, set by room admins through
    // plaza-admin and stored as JSON in the studio-published bucket. Rooms
    // with no access record stay public — exactly the old behavior.
    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (sbUrl && sbKey) {
      const admin = createClient(sbUrl, sbKey);
      const readJson = async <T>(path: string, fallback: T): Promise<T> => {
        const { data } = await admin.storage.from("studio-published").download(path);
        if (!data) return fallback;
        try { return JSON.parse(await data.text()) as T; } catch { return fallback; }
      };
      let userId = "";
      let isPlatformAdmin = false;
      const auth = req.headers.get("Authorization") || "";
      if (auth) {
        const { data: u } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
        if (u?.user) {
          userId = u.user.id;
          const { data: adm } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
          isPlatformAdmin = !!adm;
        }
      }
      const bans = await readJson<{ id: string }[]>(`moderation/${room}-bans.json`, []);
      if (userId && bans.some((b) => b.id === userId)) {
        return json({ error: "You are banned from this room.", code: "banned" }, 403);
      }
      const access = await readJson<{ mode?: string; passHash?: string; invite?: string }>(`moderation/${room}-access.json`, {});
      const mode = access.mode || "public";
      if (mode !== "public" && !isPlatformAdmin) {
        const granted = await readJson<string[]>(`moderation/${room}-admins.json`, []);
        const isRoomAdmin = !!userId && granted.includes(userId);
        if (!isRoomAdmin) {
          if (mode === "private") {
            const invite = typeof body.invite === "string" ? body.invite : "";
            if (!access.invite || invite !== access.invite) {
              return json({ error: "This level is private — you need an invitation link.", code: "invite_required" }, 403);
            }
          } else if (mode === "passcode") {
            const pw = typeof body.passcode === "string" ? body.passcode : "";
            let ok = false;
            if (pw && access.passHash) {
              const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
              ok = [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("") === access.passHash;
            }
            if (!ok) return json({ error: "This level is protected — enter the passcode.", code: pw ? "passcode_wrong" : "passcode_required" }, 403);
          }
        }
      }
    }

    const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "6h" });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
    const token = await at.toJwt();

    return json({ token, url, room, identity });
  } catch (e) {
    console.error("livekit-token error", e);
    return json({ error: e instanceof Error ? e.message : "Token error" }, 500);
  }
});
