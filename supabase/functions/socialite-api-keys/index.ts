// SOCIALITE API key management for the signed-in user (API tab).
// POST {action:"create", name, scopes} → returns the full key ONCE.
// POST {action:"list"} / {action:"revoke", id} / {action:"stats"}.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/socialiteVault.ts";
import { newKey, sha256 } from "../_shared/socialiteApiAuth.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(1).max(60), scopes: z.array(z.enum(["read", "write", "send"])).min(1).default(["read"]) }),
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("stats") }),
  z.object({ action: z.literal("revoke"), id: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const p = Body.safeParse(await req.json().catch(() => null));
    if (!p.success) return json({ error: "Invalid request" }, 400);
    const db = admin();
    const b = p.data;
    if (b.action === "create") {
      const { count } = await db.from("socialite_api_keys").select("id", { count: "exact", head: true }).eq("owner_id", auth.userId).is("revoked_at", null);
      if ((count ?? 0) >= 10) return json({ error: "You can have up to 10 active keys. Revoke one first." }, 400);
      const key = newKey();
      const { data, error } = await db.from("socialite_api_keys").insert({
        owner_id: auth.userId, name: b.name, scopes: b.scopes, prefix: key.slice(0, 12), key_hash: await sha256(key),
      }).select("id, name, prefix, scopes, created_at").single();
      if (error) throw error;
      return json({ key, record: data });
    }
    if (b.action === "revoke") {
      await db.from("socialite_api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", b.id).eq("owner_id", auth.userId);
      return json({ ok: true });
    }
    if (b.action === "stats") {
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const { data } = await db.from("socialite_api_requests").select("method, path, status, created_at").eq("owner_id", auth.userId).gte("created_at", since).order("created_at", { ascending: false }).limit(200);
      return json({ requests: data ?? [] });
    }
    const { data } = await db.from("socialite_api_keys").select("id, name, prefix, scopes, last_used_at, revoked_at, created_at").eq("owner_id", auth.userId).order("created_at", { ascending: false });
    return json({ keys: data ?? [] });
  } catch (_e) {
    return json({ error: "Something went wrong" }, 500);
  }
});
