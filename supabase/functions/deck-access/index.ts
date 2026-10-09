// Deck access: per-owner deck visibility (public / request), access requests and approvals.
// State is JSON in a private storage bucket; notifications are inserted with the service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const BUCKET = "deck-access";
type Req = { id: string; name: string; email: string | null; role: string | null; at: string };
type State = { visibility: "public" | "request" | "private"; deck_url: string | null; approved: string[]; pending: Req[] };
const empty = (): State => ({ visibility: "public", deck_url: null, approved: [], pending: [] });
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authed = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await authed.auth.getUser();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    const b = await admin.storage.getBucket(BUCKET);
    if (!b.data) await admin.storage.createBucket(BUCKET, { public: false });
    const load = async (owner: string): Promise<State> => {
      const { data } = await admin.storage.from(BUCKET).download(`${owner}.json`);
      if (!data) return empty();
      try { return { ...empty(), ...JSON.parse(await data.text()) }; } catch { return empty(); }
    };
    const save = (owner: string, s: State) =>
      admin.storage.from(BUCKET).upload(`${owner}.json`, new Blob([JSON.stringify(s)], { type: "application/json" }), { upsert: true });
    const companyDeck = async (owner: string) => {
      const { data } = await admin.from("companies").select("pitch_deck_url").eq("user_id", owner).order("created_at").limit(1);
      return data?.[0]?.pitch_deck_url ?? null;
    };

    const ownerId = String(body.owner_id || "");
    if (action === "status") {
      if (!ownerId) return json({ error: "owner_id required" }, 400);
      const s = await load(ownerId);
      const deck = s.deck_url || (await companyDeck(ownerId));
      const isOwner = user?.id === ownerId;
      const granted = isOwner || s.visibility === "public" || (!!user && s.approved.includes(user.id));
      return json({
        has_deck: !!deck,
        visibility: s.visibility,
        deck_url: granted ? deck : null,
        pending: !!user && s.pending.some((p) => p.id === user.id),
        ...(isOwner ? { own_deck_url: s.deck_url, requests: s.pending, approved_count: s.approved.length } : {}),
      });
    }

    if (!user) return json({ error: "Sign in required" }, 401);

    if (action === "settings") {
      const s = await load(user.id);
      if (["public", "request", "private"].includes(body.visibility)) s.visibility = body.visibility;
      if (body.deck_url !== undefined) s.deck_url = body.deck_url ? String(body.deck_url).slice(0, 2000) : null;
      await save(user.id, s);
      return json({ ok: true, state: s });
    }

    if (action === "request") {
      if (!ownerId || ownerId === user.id) return json({ error: "Invalid owner" }, 400);
      const s = await load(ownerId);
      if (s.approved.includes(user.id)) return json({ ok: true, approved: true });
      if (!s.pending.some((p) => p.id === user.id)) {
        const { data: prof } = await admin.from("profiles_data").select("full_name").eq("user_id", user.id).maybeSingle();
        const { data: roleRow } = await admin.rpc("get_user_role", { _user_id: user.id });
        const name = (prof as any)?.full_name || user.email || "A member";
        s.pending.push({ id: user.id, name, email: user.email ?? null, role: (roleRow as any) ?? null, at: new Date().toISOString() });
        await save(ownerId, s);
        await admin.from("notifications").insert({
          user_id: ownerId, type: "pitch_deck_request", title: "Pitch deck access request",
          message: `${name} asked to view your pitch deck.`,
          data: { requester_id: user.id, requester_name: name, requester_email: user.email, requester_role: roleRow },
        });
      }
      return json({ ok: true, pending: true });
    }

    if (action === "respond") {
      const requester = String(body.requester_id || "");
      const approve = !!body.approve;
      const s = await load(user.id);
      s.pending = s.pending.filter((p) => p.id !== requester);
      if (approve && !s.approved.includes(requester)) s.approved.push(requester);
      if (!approve) s.approved = s.approved.filter((x) => x !== requester);
      await save(user.id, s);
      await admin.from("notifications").insert({
        user_id: requester,
        type: approve ? "pitch_deck_approved" : "pitch_deck_declined",
        title: approve ? "Pitch deck access approved" : "Pitch deck request declined",
        message: approve ? "Your request to view the pitch deck has been approved!" : "Your request to view the pitch deck was declined.",
        data: { owner_id: user.id },
      });
      return json({ ok: true, state: s });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
