// Plaza moderation (kick, mute, mute all, grant admin) and level elections.
// Moderation runs through the LiveKit server API so it cannot be ignored by clients.
// Elections and granted admins are stored as JSON in the studio-published bucket
// (permanent record per level). Only platform admins or granted Plaza admins can moderate.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { RoomServiceClient, TrackSource } from "npm:livekit-server-sdk@2";

const BUCKET = "studio-published";
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const clean = (v: unknown, max = 80) => String(v ?? "").replace(/[^A-Za-z0-9_\-.:@]/g, "").slice(0, max);
const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const uidOf = (identity: string) => identity.replace(/-[a-z0-9]{6}$/, "");

type Election = {
  id: string; title: string; description: string; options: string[];
  status: "open" | "closed"; createdAt: string; createdBy: string; closedAt?: string;
  votes: Record<string, number>; // user id -> option index
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const level = clean(body.level || "plaza") || "plaza";
    const room = clean(body.room || "plaza") || "plaza";

    const readJson = async <T>(path: string, fallback: T): Promise<T> => {
      const { data } = await admin.storage.from(BUCKET).download(path);
      if (!data) return fallback;
      try { return JSON.parse(await data.text()) as T; } catch { return fallback; }
    };
    const writeJson = async (path: string, v: unknown) => {
      const { data: buckets } = await admin.storage.listBuckets();
      if (!buckets?.some((b) => b.name === BUCKET)) await admin.storage.createBucket(BUCKET, { public: true });
      const { error } = await admin.storage.from(BUCKET).upload(path, new Blob([JSON.stringify(v)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "5" });
      if (error) throw new Error(error.message);
    };
    const adminsPath = `moderation/${room}-admins.json`;
    const electionsPath = `elections/${level}.json`;

    // Public read: election record for a level.
    if (action === "elections") {
      const list = await readJson<Election[]>(electionsPath, []);
      return json({ elections: list.map((e) => ({ ...e, tally: e.options.map((_, i) => Object.values(e.votes).filter((v) => v === i).length), voters: Object.keys(e.votes).length, votes: undefined })) });
    }

    const auth = req.headers.get("Authorization") || "";
    const { data: u } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = u?.user;
    if (!user) return json({ error: "Sign in first" }, 401);

    const { data: isPlatformAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const granted = await readJson<string[]>(adminsPath, []);
    const isAdmin = !!isPlatformAdmin || granted.includes(user.id);

    if (action === "whoami") return json({ isAdmin, admins: granted });

    if (action === "vote") {
      const list = await readJson<Election[]>(electionsPath, []);
      const e = list.find((x) => x.id === body.electionId);
      if (!e || e.status !== "open") return json({ error: "This election is closed" }, 400);
      const i = Number(body.option);
      if (!Number.isInteger(i) || i < 0 || i >= e.options.length) return json({ error: "Invalid option" }, 400);
      if (e.votes[user.id] !== undefined) return json({ error: "You already voted" }, 400);
      e.votes[user.id] = i;
      await writeJson(electionsPath, list);
      return json({ ok: true });
    }

    if (!isAdmin) return json({ error: "Only Plaza admins can do this" }, 403);

    if (action === "createElection") {
      const options = (Array.isArray(body.options) ? body.options : []).map((o: unknown) => text(o, 80)).filter(Boolean).slice(0, 12);
      const title = text(body.title, 120);
      if (!title || options.length < 2) return json({ error: "Add a title and at least 2 options" }, 400);
      const list = await readJson<Election[]>(electionsPath, []);
      const e: Election = { id: crypto.randomUUID(), title, description: text(body.description, 500), options, status: "open", createdAt: new Date().toISOString(), createdBy: user.id, votes: {} };
      list.unshift(e);
      await writeJson(electionsPath, list.slice(0, 200));
      return json({ ok: true, id: e.id });
    }
    if (action === "closeElection") {
      const list = await readJson<Election[]>(electionsPath, []);
      const e = list.find((x) => x.id === body.electionId);
      if (!e) return json({ error: "Election not found" }, 404);
      e.status = "closed"; e.closedAt = new Date().toISOString();
      await writeJson(electionsPath, list);
      return json({ ok: true });
    }

    // ---- live moderation through LiveKit ----
    const s = (v?: string) => v?.trim().replace(/^['"]|['"]$/g, "").trim();
    const key = s(Deno.env.get("LIVEKIT_API_KEY")), secret = s(Deno.env.get("LIVEKIT_API_SECRET"));
    const url = s(Deno.env.get("LIVEKIT_URL"))?.replace(/\/+$/, "").replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    if (!key || !secret || !url) return json({ error: "Live voice is not configured" }, 500);
    const svc = new RoomServiceClient(url, key, secret);
    const targets: string[] = (Array.isArray(body.identities) ? body.identities : [body.identity]).map((x: unknown) => clean(x, 120)).filter(Boolean);

    const muteOne = async (identity: string, muted: boolean) => {
      const p = await svc.getParticipant(room, identity);
      for (const t of p.tracks || []) if (t.source === TrackSource.MICROPHONE) await svc.mutePublishedTrack(room, identity, t.sid, muted);
    };

    if (action === "mute" || action === "unmute") {
      for (const id of targets) await muteOne(id, action === "mute").catch(() => {});
      return json({ ok: true });
    }
    if (action === "muteAll") {
      const all = await svc.listParticipants(room);
      for (const p of all) if (p.identity !== body.self) await muteOne(p.identity, true).catch(() => {});
      return json({ ok: true, count: all.length });
    }
    if (action === "kick") {
      for (const id of targets) {
        if (granted.includes(uidOf(id)) && !isPlatformAdmin) continue; // granted admins can't kick each other
        await svc.removeParticipant(room, id).catch(() => {});
      }
      return json({ ok: true });
    }
    if (action === "grant" || action === "revoke") {
      const ids = targets.map(uidOf).filter((x) => x && x !== "guest" && /^[0-9a-f-]{36}$/.test(x));
      if (!ids.length) return json({ error: "Guests without an account cannot be admins" }, 400);
      const next = action === "grant" ? [...new Set([...granted, ...ids])] : granted.filter((g) => !ids.includes(g));
      await writeJson(adminsPath, next);
      return json({ ok: true, admins: next });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 500);
  }
});
